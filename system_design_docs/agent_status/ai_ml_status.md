# AI/ML Agent Status Report

> **Generated**: 2026-01-28
> **Repository**: Alma Document Automation
> **Agent Focus**: Extraction Pipelines, MRZ Parsing, Claude Vision Integration, OCR, Prompt Engineering

---

## Executive Summary

The Alma repository implements a **dual-pipeline extraction architecture** for immigration document processing:
1. **PassportEye Service** (Port 8000) - MRZ-based passport data extraction using Tesseract OCR
2. **G-28 Extraction Service** (Port 8001) - Claude Vision-powered form field extraction

The system follows a **Chain of Responsibility** pattern with well-defined fallback strategies and confidence scoring. Overall architecture is solid with room for improvement in error recovery, prompt versioning, and extraction observability.

---

## Current State

### Extraction Capabilities

| Document Type | Primary Method | Fallback | Confidence Range |
|---------------|----------------|----------|------------------|
| Passport | PassportEye (Tesseract OCR) | MRZ Parser -> NuExtract API | 0.5 - 0.98 |
| G-28 Form | Claude Vision API | None (explicit failure) | 0.70 - 0.95 |

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                             │
│                    (src/lib/extraction/pipeline.ts)                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  PassportEye Svc    │         │  G-28 Extraction    │
│  Port: 8000         │         │  Port: 8001         │
│  Tech: Python/Flask │         │  Tech: Python/Fast  │
│  OCR: Tesseract     │         │  AI: Claude Vision  │
└─────────────────────┘         └─────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐         ┌─────────────────────┐
│  passporteye lib    │         │  Anthropic SDK      │
│  (MRZ detection)    │         │  (Claude API)       │
└─────────────────────┘         └─────────────────────┘
```

---

## Patterns Found

### 1. Pipeline Structure

**Passport Extraction Pipeline** (`src/lib/extraction/pipeline.ts:100-243`)
```
1. PassportEye Service (if enabled)
   └─> Success: Return validated data
   └─> Failure: Continue to fallback

2. MRZ Parser (if OCR text available)
   └─> Success: Return validated data
   └─> Failure: Continue to fallback

3. NuExtract API (final fallback)
   └─> Normalize dates/sex fields
   └─> Validate with Zod schema
   └─> Return result with confidence
```

**G-28 Extraction Pipeline** (`src/lib/extraction/pipeline.ts:297-449`)
```
1. PDF Preprocessing (if PDF)
   └─> Convert to page images (300 DPI)
   └─> Failure: Return error immediately

2. Claude Vision (page-by-page)
   └─> Extract each page independently
   └─> Merge results from all pages
   └─> Validate with Zod schema
   └─> No fallback - explicit failure on error
```

### 2. Error Handling Patterns

**Custom Error Classes:**
- `PassportEyeError` - Codes: `TIMEOUT`, `API_ERROR`, `DISABLED`, `NETWORK_ERROR`
- `ClaudeVisionError` - Codes: `API_ERROR`, `PARSE_ERROR`, `DISABLED`, `NO_API_KEY`
- `G28ClaudeError` - Codes: `TIMEOUT`, `API_ERROR`, `DISABLED`, `NETWORK_ERROR`, `BILLING_ERROR`, `QUOTA_ERROR`, `RATE_LIMIT_ERROR`
- `NuExtractError` - Codes: `TIMEOUT`, `API_ERROR`, `EXTRACTION_FAILED`
- `PdfConversionError` - Codes: `TIMEOUT`, `API_ERROR`, `NETWORK_ERROR`

**Error Classification** (`g28-claude-client.ts:90-110`):
```typescript
function classifyErrorResponse(errorText: string): ErrorCode {
  if (lowerError.includes('credit balance') || lowerError.includes('billing'))
    return 'BILLING_ERROR';
  if (lowerError.includes('quota') || lowerError.includes('limit exceeded'))
    return 'QUOTA_ERROR';
  if (lowerError.includes('rate limit'))
    return 'RATE_LIMIT_ERROR';
  return 'API_ERROR';
}
```

### 3. Confidence Scoring

**PassportEye Service** (`passporteye-service/app/extraction.py:158-161`):
```python
valid_checks = mrz_data.get("valid_score", 0)
confidence = min(valid_checks / 100.0, 1.0) if valid_checks else 0.98
```

**MRZ Parser** (`src/lib/extraction/mrz/parser.ts:269-270`):
```typescript
const confidence = errors.length === 0
  ? 0.98
  : Math.max(0.5, 0.98 - errors.length * 0.15);
```

**G-28 Extraction**: Fixed confidence values
- Successful extraction: `0.95`
- Validation failed but data returned: `0.70`
- Hardcoded in Python service: `0.95` always

### 4. Data Normalization

**Python Service** (`g28-extraction-service/app/normalization.py`):
- State normalization (full name to 2-letter code)
- Phone E.164 formatting (`+1XXXXXXXXXX`)
- Email lowercase/trim
- Alien number A-prefix normalization

**TypeScript Pipeline** (`src/lib/extraction/pipeline.ts:47-89`):
- Date format normalization (DD/MM/YYYY, DD.MM.YYYY to YYYY-MM-DD)
- Sex field normalization (MALE/FEMALE/OTHER to M/F/X)

---

## Services Detail

### PassportEye Service (Port 8000)

**Location**: `/Users/tto/Desktop/alma/passporteye-service/`

**Files**:
- `app/main.py` - FastAPI endpoint `/extract`
- `app/extraction.py` - PassportEye wrapper with MRZ parsing

**Capabilities**:
- Accepts: JPEG, PNG, PDF (10MB max)
- Uses `passporteye.read_mrz()` for MRZ detection
- Date parsing with century detection for DOB vs expiration
- Check digit validation via PassportEye's `valid_score`

**Health Check**: `GET /health`

**Configuration**:
```
ALLOWED_ORIGINS=*
MAX_FILE_SIZE=10MB
PASSPORTEYE_API_URL=http://localhost:8000/extract
PASSPORTEYE_TIMEOUT_MS=30000
```

### G-28 Extraction Service (Port 8001)

**Location**: `/Users/tto/Desktop/alma/g28-extraction-service/`

**Files**:
- `app/main.py` - FastAPI endpoints `/extract`, `/convert-pdf`, `/health`, `/health/deep`
- `app/extraction.py` - Claude Vision API integration
- `app/schemas.py` - Pydantic models for G-28 data
- `app/normalization.py` - Data normalization utilities
- `app/pdf_processing.py` - PDF to image conversion

**Capabilities**:
- Accepts: PDF, JPEG, PNG (10MB max)
- PDF conversion at 300 DPI using `pdf2image`
- Multi-page extraction with result merging
- Deep health check validates API key and billing status

**Health Checks**:
- `GET /health` - Basic service health
- `GET /health/deep` - Validates Anthropic API connectivity

**Configuration**:
```
ANTHROPIC_API_KEY=<required>
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ALLOWED_ORIGINS=*
MAX_FILE_SIZE=10MB
G28_CLAUDE_API_URL=http://localhost:8001/extract
G28_CLAUDE_TIMEOUT_MS=60000
```

---

## Prompt Engineering

### G-28 Extraction Prompt (Python Service)

**Location**: `g28-extraction-service/app/extraction.py:13-57`

```python
EXTRACTION_PROMPT = """Analyze this G-28 immigration form image and extract...

Rules:
- Return ONLY valid JSON, no markdown code blocks or explanation
- Use empty string "" for fields not found or not visible
- Use false for boolean fields if checkbox is not checked or not visible
- Extract phone numbers exactly as written (will be normalized later)
...
"""
```

### G-28 Extraction Prompt (Direct Claude Vision)

**Location**: `src/lib/extraction/claude-vision-client.ts:69-92`

```typescript
const G28_EXTRACTION_PROMPT = `Extract G-28 form data from this image...

IMPORTANT:
- Only include fields that are clearly visible on the form
- Use empty string "" for missing text fields
- Return ONLY the JSON object, no markdown formatting or explanation
- If a checkbox is clearly marked/checked, set the corresponding boolean to true`;
```

**Note**: Two different prompts exist - one in Python service, one in TypeScript direct client. They have similar structure but different field naming conventions.

### NuExtract Templates

**Location**: `src/lib/extraction/templates.ts`

```typescript
export const PASSPORT_TEMPLATE = {
  surname: '',
  givenNames: '',
  documentNumber: '',
  dateOfBirth: '',
  expirationDate: '',
  sex: '',
  nationality: '',
  issuingCountry: '',
} as const;

export const G28_TEMPLATE = {
  attorneyName: '',
  firmName: '',
  // ... 15 fields total
} as const;
```

---

## Quality Assessment

### Strengths

1. **Clean Separation of Concerns**
   - Python microservices handle OCR/Vision
   - TypeScript orchestrates pipeline logic
   - Pydantic/Zod schemas enforce type safety

2. **Robust Error Classification**
   - Specific error codes for billing, quota, rate limits
   - Deep health check validates API connectivity
   - Timeout handling with AbortController

3. **Chain of Responsibility Implementation**
   - PassportEye -> MRZ Parser -> NuExtract fallback chain
   - Each step logged with warnings for traceability
   - Confidence scores guide decision making

4. **MRZ Parser Quality**
   - Full ICAO 9303 check digit validation
   - Century detection for dates
   - Country code to name mapping
   - Comprehensive test coverage (167 lines of tests)

5. **Data Normalization**
   - Consistent E.164 phone format
   - State code standardization
   - Date format normalization

### Areas for Improvement

1. **Confidence Scoring is Static**
   - G-28 extraction always returns 0.95 confidence regardless of extraction quality
   - No per-field confidence
   - No correlation between extraction completeness and confidence

2. **Prompt Duplication**
   - Two different G-28 prompts in Python service and TypeScript client
   - Different field naming conventions between them
   - No prompt versioning system

3. **Limited Extraction Observability**
   - No metrics collection (extraction latency, success rate)
   - No structured logging with extraction metadata
   - No A/B testing framework for prompts

4. **Missing Retry Logic**
   - No automatic retry on transient failures
   - Rate limit errors fail immediately
   - No exponential backoff

5. **No Extraction Audit Trail**
   - Extracted data not persisted for review
   - No diff tracking between document versions
   - Cannot replay extractions for debugging

6. **G-28 Has No Fallback**
   - Claude Vision failure = complete failure
   - No alternative extraction method
   - Single point of failure for G-28 forms

7. **Hardcoded Model Names**
   - Python service defaults to specific model version
   - No model A/B testing capability
   - Model updates require code changes

---

## Recommendations

### High Priority (Aligned with ai-ml.md Guidelines)

#### 1. Dynamic Confidence Scoring
```typescript
// Implement field-level confidence
interface FieldConfidence {
  value: string;
  confidence: number;
  source: 'direct' | 'inferred' | 'default';
}

// Calculate overall confidence from field completeness
function calculateConfidence(fields: Record<string, FieldConfidence>): number {
  const weights = { direct: 1.0, inferred: 0.7, default: 0.3 };
  return Object.values(fields).reduce(
    (sum, f) => sum + f.confidence * weights[f.source],
    0
  ) / Object.keys(fields).length;
}
```

#### 2. Prompt Versioning System
```
prompts/
  g28/
    v1.0.0.md  # Original prompt
    v1.1.0.md  # Improved field extraction
    active.md  # Symlink to active version
  passport/
    v1.0.0.md
    active.md
```

#### 3. Retry with Exponential Backoff
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryable(error) || attempt === maxRetries - 1) throw error;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
}
```

### Medium Priority

#### 4. Extraction Metrics Collection
```typescript
// Add OpenTelemetry spans for extraction
const span = tracer.startSpan('g28.extraction');
span.setAttribute('document.pages', pageCount);
span.setAttribute('model', process.env.ANTHROPIC_MODEL);
// ... extraction logic
span.setAttribute('extraction.confidence', result.confidence);
span.end();
```

#### 5. Unify Prompt Templates
- Move all prompts to `/prompts/` directory
- Load at runtime from versioned files
- Single source of truth for both Python and TypeScript

#### 6. G-28 Fallback Strategy
Consider adding:
- OCR + heuristic extraction as fallback
- Multi-model ensemble (Claude + GPT-4V)
- Cached extraction templates for common form layouts

### Lower Priority

#### 7. Extraction Audit Trail
```sql
CREATE TABLE extraction_audits (
  id UUID PRIMARY KEY,
  document_hash TEXT,
  extraction_method TEXT,
  raw_response JSONB,
  normalized_data JSONB,
  confidence DECIMAL,
  created_at TIMESTAMP
);
```

#### 8. Model A/B Testing
- Route percentage of requests to different models
- Compare extraction accuracy across models
- Automatic model selection based on document type

---

## Verification Commands

```bash
# Test PassportEye service health
curl http://localhost:8000/health

# Test G-28 service health (shallow)
curl http://localhost:8001/health

# Test G-28 service health (deep - validates API key)
curl http://localhost:8001/health/deep

# Test passport extraction
curl -X POST -F "file=@test/fixtures/passports/valid/specimen.jpg" \
  http://localhost:8000/extract

# Test G-28 extraction
curl -X POST -F "file=@test/fixtures/g28/valid/sample.pdf" \
  http://localhost:8001/extract

# Test PDF conversion
curl -X POST -F "file=@test/fixtures/g28/valid/sample.pdf" \
  http://localhost:8001/convert-pdf

# Run extraction tests
npm run test -- src/lib/__tests__/mrz-parser.test.ts
npm run test -- src/lib/__tests__/pipeline-utils.test.ts
```

---

## File Inventory

### Python Services
| File | Purpose | Lines |
|------|---------|-------|
| `passporteye-service/app/main.py` | FastAPI app, `/extract` endpoint | 128 |
| `passporteye-service/app/extraction.py` | MRZ extraction logic | 189 |
| `g28-extraction-service/app/main.py` | FastAPI app, multiple endpoints | 314 |
| `g28-extraction-service/app/extraction.py` | Claude Vision integration | 189 |
| `g28-extraction-service/app/schemas.py` | Pydantic models | 80 |
| `g28-extraction-service/app/normalization.py` | Data normalization | 251 |
| `g28-extraction-service/app/pdf_processing.py` | PDF to image conversion | 79 |

### TypeScript Pipeline
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/extraction/pipeline.ts` | Orchestration | 450 |
| `src/lib/extraction/passporteye-client.ts` | Service client | 125 |
| `src/lib/extraction/g28-claude-client.ts` | Docker service client | 209 |
| `src/lib/extraction/claude-vision-client.ts` | Direct API client | 185 |
| `src/lib/extraction/nuextract-client.ts` | Fallback extraction | 137 |
| `src/lib/extraction/pdf-converter-client.ts` | PDF conversion | 125 |
| `src/lib/extraction/mrz/parser.ts` | MRZ parsing | 302 |
| `src/lib/extraction/templates.ts` | NuExtract templates | 57 |
| `src/lib/config/extraction.ts` | Config management | 131 |

### Tests
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/__tests__/mrz-parser.test.ts` | MRZ parser tests | 167 |
| `src/lib/__tests__/pipeline-utils.test.ts` | Pipeline utility tests | 101 |

---

## Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | - | Claude API authentication |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-20250514` | Claude model selection |
| `NUEXTRACT_API_URL` | Yes | - | NuExtract service URL |
| `NUEXTRACT_API_KEY` | Yes | - | NuExtract authentication |
| `PASSPORTEYE_API_URL` | No | - | PassportEye service URL |
| `PASSPORTEYE_TIMEOUT_MS` | No | `30000` | PassportEye timeout |
| `PASSPORTEYE_ENABLED` | No | `true` | Enable PassportEye |
| `G28_CLAUDE_API_URL` | No | - | G-28 service URL |
| `G28_CLAUDE_TIMEOUT_MS` | No | `60000` | G-28 timeout |
| `G28_CLAUDE_ENABLED` | No | `true` | Enable G-28 Claude |

---

## Next Steps

1. **Immediate**: Implement dynamic confidence scoring for G-28 extraction
2. **Short-term**: Unify prompt templates into `/prompts/` directory with versioning
3. **Medium-term**: Add retry logic with exponential backoff for transient failures
4. **Long-term**: Build extraction audit trail for debugging and quality analysis

---

*Report generated by AI/ML Agent analysis of the Alma Document Automation repository.*
