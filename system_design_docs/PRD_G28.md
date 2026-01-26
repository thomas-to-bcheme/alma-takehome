# PRD: G-28 PDF Extraction with Claude Vision

## Overview

Extract structured data from G-28 immigration forms (Notice of Entry of Appearance as Attorney or Accredited Representative) using Claude Vision API. The system converts PDF pages to images, sends them to Claude for visual analysis, normalizes the extracted data, and populates the target web form.

## Architecture

```
Frontend (React)                    Python Microservice (g28-extraction-service)
     │                                     │
     │  POST /extract                      │
     │  (multipart/form-data)              │
     └────────────────────────────────────►│
                                           │
     ┌─────────────────────────────────────┤
     │  1. Receive G-28 PDF                │
     │  2. pdf2image → PNG (300 DPI)       │
     │  3. Claude Vision API extraction    │
     │  4. Normalize (E.164, state codes)  │
     │  5. Validate with Pydantic          │
     │  6. Return JSON response            │
     └─────────────────────────────────────┘
                    │
                    ▼
     TypeScript Client (g28-claude-client.ts)
                    │
                    ▼
     Extraction Pipeline (pipeline.ts)
                    │
                    ▼
     Form Mapping (mapExtractedToForm.ts)
                    │
                    ▼
     Form Population (FormA28.tsx)
```

## File Structure

### Python Microservice

```
g28-extraction-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI routes, CORS, health check
│   ├── extraction.py        # Claude Vision API integration
│   ├── pdf_processing.py    # pdf2image conversion (300 DPI)
│   ├── normalization.py     # E.164 phone, state codes, email
│   └── schemas.py           # Pydantic request/response models
├── requirements.txt         # fastapi, pdf2image, anthropic, pillow
├── Dockerfile
├── .env.example
└── README.md
```

### TypeScript Integration

```
src/
├── lib/
│   ├── config/
│   │   └── extraction.ts          # G-28 Claude config section
│   ├── extraction/
│   │   ├── g28-claude-client.ts   # TypeScript client
│   │   └── pipeline.ts            # Updated with Claude Vision
│   └── mapExtractedToForm.ts      # Updated field mapping
└── types/
    └── index.ts                   # G28ClaudeData type (if needed)
```

## G-28 Form Field Mapping

### Part 1: Attorney/Representative Information

| G-28 Field | Claude Extraction Key | Form Field | Notes |
|------------|----------------------|------------|-------|
| 1.a. Family Name | `attorney.family_name` | `attorneyLastName` | |
| 1.b. Given Name | `attorney.given_name` | `attorneyFirstName` | |
| 1.c. Middle Name | `attorney.middle_name` | `attorneyMiddleName` | |
| 2. Firm Name | `attorney.firm_name` | `firmName` | Also maps to `lawFirmOrOrganization` |
| 3. Street Address | `attorney.address.street` | `street` | |
| 3. Suite/Floor | `attorney.address.suite` | `suite` | |
| 3. City | `attorney.address.city` | `city` | |
| 3. State | `attorney.address.state` | `state` | Normalize to 2-letter code |
| 3. ZIP Code | `attorney.address.zip_code` | `zipCode` | |
| 4. Daytime Phone | `attorney.phone` | `daytimePhone` | Normalize to E.164 |
| 5. Email | `attorney.email` | `email` | Lowercase, trimmed |

### Part 2: Eligibility Information

| G-28 Field | Claude Extraction Key | Form Field | Notes |
|------------|----------------------|------------|-------|
| 1.a. Attorney checkbox | `eligibility.is_attorney` | `isAttorney` | Boolean |
| 1.b. Bar Number | `eligibility.bar_number` | `barNumber` | |
| 2.a. Accredited Rep checkbox | `eligibility.is_accredited_rep` | `isAccreditedRep` | Boolean |

### Part 3: Client Information

| G-28 Field | Claude Extraction Key | Form Field | Notes |
|------------|----------------------|------------|-------|
| 1.a. Family Name | `client.family_name` | `clientLastName` | |
| 1.b. Given Name | `client.given_name` | `clientFirstName` | |
| 1.c. Middle Name | `client.middle_name` | `clientMiddleName` | |
| 3. Phone | `client.phone` | (secondary contact) | Normalize to E.164 |
| 4. Email | `client.email` | (secondary contact) | |
| 5. A-Number | `client.alien_number` | `alienNumber` | |

## Python Service Implementation

### PDF Processing (`pdf_processing.py`)

```python
from pdf2image import convert_from_bytes
from typing import list
from PIL import Image
import io
import base64

def pdf_to_images(pdf_bytes: bytes, max_pages: int = 4) -> list[str]:
    """
    Convert PDF to base64-encoded PNG images at 300 DPI.

    Args:
        pdf_bytes: Raw PDF file content
        max_pages: Maximum pages to process (G-28 is typically 2-4 pages)

    Returns:
        List of base64-encoded PNG images
    """
    images = convert_from_bytes(
        pdf_bytes,
        dpi=300,
        fmt='png',
        first_page=1,
        last_page=max_pages,
    )

    base64_images = []
    for img in images:
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        base64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
        base64_images.append(base64_str)

    return base64_images
```

### Claude Vision Extraction (`extraction.py`)

```python
import anthropic
import json
from typing import Any

EXTRACTION_PROMPT = """Analyze this G-28 immigration form image and extract the following information as JSON.

Extract these fields if visible:

{
  "attorney": {
    "family_name": "",
    "given_name": "",
    "middle_name": "",
    "firm_name": "",
    "address": {
      "street": "",
      "suite": "",
      "city": "",
      "state": "",
      "zip_code": ""
    },
    "phone": "",
    "email": ""
  },
  "eligibility": {
    "is_attorney": false,
    "bar_number": "",
    "is_accredited_rep": false
  },
  "client": {
    "family_name": "",
    "given_name": "",
    "middle_name": "",
    "phone": "",
    "email": "",
    "alien_number": ""
  }
}

Rules:
- Return ONLY valid JSON, no markdown or explanation
- Use empty string "" for fields not found
- Use false for boolean fields if checkbox is not checked
- Extract phone numbers as-is (will be normalized later)
- Extract state names as-is (will be normalized later)
- For alien numbers, include the "A-" prefix if present
"""

def extract_with_claude(
    base64_images: list[str],
    api_key: str,
    model: str = "claude-sonnet-4-20250514"
) -> dict[str, Any]:
    """
    Extract G-28 data using Claude Vision API.
    """
    client = anthropic.Anthropic(api_key=api_key)

    # Build content with all page images
    content = []
    for i, img_base64 in enumerate(base64_images):
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": img_base64,
            },
        })
        content.append({
            "type": "text",
            "text": f"Page {i + 1} of G-28 form"
        })

    content.append({
        "type": "text",
        "text": EXTRACTION_PROMPT
    })

    response = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": content}]
    )

    # Parse JSON from response
    response_text = response.content[0].text
    return json.loads(response_text)
```

### Data Normalization (`normalization.py`)

```python
import re

# US State name to code mapping
STATE_MAPPING = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "district of columbia": "DC", "florida": "FL", "georgia": "GA", "hawaii": "HI",
    "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME",
    "maryland": "MD", "massachusetts": "MA", "michigan": "MI", "minnesota": "MN",
    "mississippi": "MS", "missouri": "MO", "montana": "MT", "nebraska": "NE",
    "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
    "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI",
    "south carolina": "SC", "south dakota": "SD", "tennessee": "TN", "texas": "TX",
    "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
}

def normalize_state(state: str) -> str:
    """Normalize state to 2-letter code."""
    if not state:
        return ""

    state = state.strip()

    # Already a 2-letter code
    if len(state) == 2 and state.upper() in STATE_MAPPING.values():
        return state.upper()

    # Look up full name
    normalized = STATE_MAPPING.get(state.lower(), state)
    return normalized

def normalize_phone_e164(phone: str) -> str:
    """Normalize phone number to E.164 format (+1XXXXXXXXXX)."""
    if not phone:
        return ""

    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)

    # Handle various US formats
    if len(digits) == 10:
        return f"+1{digits}"
    elif len(digits) == 11 and digits.startswith('1'):
        return f"+{digits}"

    # Return original if can't normalize
    return phone

def normalize_email(email: str) -> str:
    """Normalize email to lowercase, trimmed."""
    if not email:
        return ""
    return email.strip().lower()

def normalize_extraction_result(raw_data: dict) -> dict:
    """Apply all normalizations to extracted data."""
    result = raw_data.copy()

    # Normalize attorney fields
    if "attorney" in result:
        attorney = result["attorney"]
        if "address" in attorney:
            attorney["address"]["state"] = normalize_state(
                attorney["address"].get("state", "")
            )
        attorney["phone"] = normalize_phone_e164(attorney.get("phone", ""))
        attorney["email"] = normalize_email(attorney.get("email", ""))

    # Normalize client fields
    if "client" in result:
        client = result["client"]
        client["phone"] = normalize_phone_e164(client.get("phone", ""))
        client["email"] = normalize_email(client.get("email", ""))

    return result
```

### Pydantic Schemas (`schemas.py`)

```python
from pydantic import BaseModel, Field
from typing import Optional

class Address(BaseModel):
    street: str = ""
    suite: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = Field("", alias="zipCode")

class AttorneyInfo(BaseModel):
    family_name: str = Field("", alias="familyName")
    given_name: str = Field("", alias="givenName")
    middle_name: str = Field("", alias="middleName")
    firm_name: str = Field("", alias="firmName")
    address: Address = Field(default_factory=Address)
    phone: str = ""
    email: str = ""

class EligibilityInfo(BaseModel):
    is_attorney: bool = Field(False, alias="isAttorney")
    bar_number: str = Field("", alias="barNumber")
    is_accredited_rep: bool = Field(False, alias="isAccreditedRep")

class ClientInfo(BaseModel):
    family_name: str = Field("", alias="familyName")
    given_name: str = Field("", alias="givenName")
    middle_name: str = Field("", alias="middleName")
    phone: str = ""
    email: str = ""
    alien_number: str = Field("", alias="alienNumber")

class G28ExtractionResult(BaseModel):
    success: bool
    data: Optional[dict] = None
    confidence: float = 0.0
    error: Optional[str] = None

class G28Data(BaseModel):
    attorney: AttorneyInfo = Field(default_factory=AttorneyInfo)
    eligibility: EligibilityInfo = Field(default_factory=EligibilityInfo)
    client: ClientInfo = Field(default_factory=ClientInfo)
```

### FastAPI Routes (`main.py`)

```python
import os
import logging
from typing import Annotated

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.pdf_processing import pdf_to_images
from app.extraction import extract_with_claude
from app.normalization import normalize_extraction_result
from app.schemas import G28ExtractionResult

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="G-28 Extraction Service",
    description="Extract structured data from G-28 immigration forms using Claude Vision",
    version="1.0.0",
)

# Configure CORS
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

ACCEPTED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "service": "g28-extraction"}


@app.post("/extract")
async def extract_g28(
    file: Annotated[UploadFile, File(description="G-28 PDF or image file")]
) -> G28ExtractionResult:
    """Extract G-28 data using Claude Vision API."""

    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ACCEPTED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Accepted: PDF, JPEG, PNG",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum: 10MB",
        )

    logger.info(
        "Processing G-28 extraction",
        extra={"filename": file.filename, "size": len(content)},
    )

    try:
        # Convert PDF to images (or use image directly)
        if content_type == "application/pdf":
            base64_images = pdf_to_images(content, max_pages=4)
        else:
            import base64
            base64_images = [base64.b64encode(content).decode('utf-8')]

        # Extract with Claude Vision
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        raw_data = extract_with_claude(base64_images, api_key, model)

        # Normalize the data
        normalized_data = normalize_extraction_result(raw_data)

        logger.info("G-28 extraction successful")

        return G28ExtractionResult(
            success=True,
            data=normalized_data,
            confidence=0.95,
            error=None,
        )

    except Exception as e:
        logger.exception("G-28 extraction failed")
        return G28ExtractionResult(
            success=False,
            data=None,
            confidence=0.0,
            error=str(e),
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors."""
    logger.exception("Unexpected error")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "confidence": 0.0,
            "error": "Internal server error",
        },
    )
```

## Environment Variables

### Python Service (.env)

```bash
# Anthropic API
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}  # Required
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# Logging
LOG_LEVEL=INFO
```

### Next.js (.env.local)

```bash
# G-28 Claude Extraction Service
G28_CLAUDE_API_URL=http://localhost:8001/extract
G28_CLAUDE_TIMEOUT_MS=60000
G28_CLAUDE_ENABLED=true
```

## TypeScript Client

See `src/lib/extraction/g28-claude-client.ts` for implementation following the `passporteye-client.ts` pattern:

- `extractG28WithClaude(fileBuffer, mimeType)` - Main extraction function
- `G28ClaudeResult` - Response type with success, data, confidence, error
- `G28ClaudeError` - Error class with codes: TIMEOUT, API_ERROR, DISABLED, NETWORK_ERROR
- `isG28ClaudeEnabled()` - Check if service is enabled

## Verification Steps

1. **Start Python service:**
   ```bash
   cd g28-extraction-service
   pip install -r requirements.txt
   uvicorn app.main:app --port 8001 --reload
   ```

2. **Verify health check:**
   ```bash
   curl http://localhost:8001/health
   # {"status":"healthy","service":"g28-extraction"}
   ```

3. **Start Next.js:**
   ```bash
   npm run dev
   ```

4. **Upload test G-28 PDF and verify:**
   - [ ] Attorney name extracted correctly
   - [ ] Firm name populated
   - [ ] Phone in E.164 format (+1XXXXXXXXXX)
   - [ ] State as 2-letter code (CA, NY, etc.)
   - [ ] isAttorney checkbox detected
   - [ ] Bar number extracted
   - [ ] Client info extracted
   - [ ] Form fields populated correctly

## Dependencies

### Python (`requirements.txt`)

```
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
pdf2image==1.17.0
Pillow==10.2.0
anthropic==0.40.0
pydantic==2.6.0
```

### System Dependencies

- **poppler-utils**: Required by pdf2image for PDF conversion
  - macOS: `brew install poppler`
  - Ubuntu: `apt-get install poppler-utils`
  - Docker: See Dockerfile

## References

- `passporteye-service/` - Reference implementation for FastAPI pattern
- `src/lib/extraction/passporteye-client.ts` - TypeScript client pattern
- `src/lib/extraction/pipeline.ts` - Pipeline integration point
- `src/lib/mapExtractedToForm.ts` - Form data mapping
- `src/lib/validation/formA28Schema.ts` - Form field definitions
- [Claude Vision API Docs](https://docs.anthropic.com/en/docs/build-with-claude/vision)
- [pdf2image Documentation](https://github.com/Belval/pdf2image)
