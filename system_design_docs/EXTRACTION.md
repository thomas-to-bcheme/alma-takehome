# Document Extraction Pipeline

> Reference: `.agents/ai-ml.md`

## Overview

Multi-strategy extraction system that uses MRZ parsing, OCR, and LLM vision to extract data from passport and G-28 documents.

## Data Sources by Document Type

Each document serves as the authoritative source for specific fields. The passport does not contain addresses or emails, so contact information must be pulled from the G-28.

### Passport — Machine Readable Zone (MRZ)

The MRZ is the **source of truth** for personal identity information. This format is standardized across ICAO-compliant passports (including USA, AUS, and other countries).

| Field | MRZ Format | Example |
|-------|------------|---------|
| Given Name | First name(s) | Joe |
| Surname | Family name | Jonas |
| Date of Birth | YYMMDD | 900515 → May 15, 1990 |
| Nationality | 3-letter ISO code | USA, AUS, GBR |
| Sex | M/F/X | M |
| Passport Number | Document number | 123456789 |
| Expiration Date | YYMMDD | 300514 → May 14, 2030 |

### G-28 Form — Contact Information & Attorney Details

The G-28 is the **source of truth** for contact information and attorney/representative details.

#### Client Contact Info (Part 3)

| Field | G-28 Location | Example |
|-------|---------------|---------|
| Client Email | Part 3, Item 12 | b.smith_00@test.ai |
| Client Phone | Part 3, Item 10 | +61 45453434 |
| Street Address | Part 3, Mailing Address | 16 Anytown Street |
| City | Part 3, Mailing Address | Perth |
| State/Province | Part 3, Mailing Address | WA |
| Postal Code | Part 3, Mailing Address | 6000 |
| Country | Part 3, Mailing Address | Australia |

#### Attorney/Representative Info (Part 1)

| Field | G-28 Location | Example |
|-------|---------------|---------|
| Attorney Name | Part 1 | Barbara Smith |
| Firm Name | Part 1 | Alma Legal Services PC |
| Attorney Email | Part 1 | immigration@tryalma.ai |
| Attorney Address | Part 1 | 545 Bryant Street, Palo Alto, CA 94301 |

---

## Extraction Strategy Priority

The system uses **document-specific pipelines** optimized for each document type:

```
PASSPORT PIPELINE                    G-28 PIPELINE
─────────────────                    ──────────────
1. PassportEye (Tesseract OCR)       1. PDF → Image (300 DPI)
        ↓ failed?                            ↓
2. MRZ Parser (ICAO 9303)            2. Claude Vision (3.5 Sonnet)
        ↓ failed?                            ↓
3. NuExtract API (fallback)          3. Schema Validation (Zod)
```

### Passport Pipeline

PassportEye is the **primary extraction method** for passports. It uses Tesseract OCR optimized for MRZ detection and parsing.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASSPORT EXTRACTION                           │
└─────────────────────────────────────────────────────────────────┘

Passport Image
      │
      ▼
┌─────────────────────┐
│  1. PASSPORTEYE     │  ◄── Primary: Tesseract OCR + MRZ detection
│     (Python API)    │      Runs via Flask microservice
└────────┬────────────┘
         │ MRZ extracted?
    Yes ─┤
         │ No
         ▼
┌─────────────────────┐
│  2. MRZ PARSER      │  ◄── Secondary: ICAO 9303 format parsing
│     (TypeScript)    │      Uses check digit validation
└────────┬────────────┘
         │ Valid MRZ?
    Yes ─┤
         │ No
         ▼
┌─────────────────────┐
│  3. NUEXTRACT API   │  ◄── Fallback: LLM-based extraction
│     (External)      │      For damaged/unclear passports
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  NORMALIZATION      │  ◄── Country codes, dates, validation
└─────────────────────┘
```

### G-28 Pipeline (LLM-First)

G-28 forms use **Claude Vision as the primary extraction method** due to the complex, variable layout of form fields.

```
┌─────────────────────────────────────────────────────────────────┐
│                    G-28 EXTRACTION (LLM-FIRST)                   │
└─────────────────────────────────────────────────────────────────┘

G-28 PDF/Image
      │
      ▼
┌─────────────────────┐
│  1. PREPROCESSING   │  ◄── PDF → Image conversion at 300 DPI
│     (pdf2image)     │      Sharp for image optimization
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  2. CLAUDE VISION   │  ◄── Primary: Claude 3.5 Sonnet multimodal
│     (3.5 Sonnet)    │      Structured JSON extraction
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  3. VALIDATION      │  ◄── Zod schema validation
│     (Zod)           │      E.164 phone, email normalization
└─────────────────────┘
```

---

## 1. Passport Extraction: MRZ Parsing

### MRZ Format (TD3 - Passport)

```
Line 1: P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<
Line 2: L898902C36UTO7408122F1204159ZE184226B<<<<<10
```

### Field Positions

| Line | Position | Field |
|------|----------|-------|
| 1 | 0-1 | Document type (P = Passport) |
| 1 | 2-4 | Issuing country (3-letter code) |
| 1 | 5-43 | Name (SURNAME<<GIVEN<NAMES) |
| 2 | 0-8 | Document number |
| 2 | 9 | Check digit (document number) |
| 2 | 10-12 | Nationality |
| 2 | 13-18 | Date of birth (YYMMDD) |
| 2 | 19 | Check digit (DOB) |
| 2 | 20 | Sex (M/F/X) |
| 2 | 21-26 | Expiration date (YYMMDD) |
| 2 | 27 | Check digit (expiration) |
| 2 | 28-42 | Personal number |
| 2 | 43 | Overall check digit |

### Check Digit Algorithm

```typescript
function calculateCheckDigit(data: string): number {
  const weights = [7, 3, 1];
  let sum = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    let value: number;

    if (char === '<') {
      value = 0;
    } else if (char >= '0' && char <= '9') {
      value = parseInt(char, 10);
    } else {
      value = char.charCodeAt(0) - 55; // A=10, B=11, etc.
    }

    sum += value * weights[i % 3];
  }

  return sum % 10;
}
```

### MRZ Detection

```typescript
interface MRZDetectionResult {
  found: boolean;
  lines: string[];
  type: 'TD1' | 'TD2' | 'TD3' | null;  // ID card, visa, passport
  boundingBox?: { x: number; y: number; width: number; height: number };
}
```

---

## 2. Passport Extraction: PassportEye Service

PassportEye is a Python library that provides specialized MRZ detection and extraction using Tesseract OCR optimized for passport documents.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASSPORTEYE SERVICE                           │
└─────────────────────────────────────────────────────────────────┘

Next.js App                     Flask Microservice
     │                                  │
     │  POST /extract                   │
     │  (base64 image)                  │
     ├─────────────────────────────────►│
     │                                  │  1. Decode image
     │                                  │  2. PassportEye.read()
     │                                  │  3. Extract MRZ fields
     │  JSON response                   │
     │◄─────────────────────────────────┤
     │                                  │
```

### Service Configuration

```python
# passporteye-service/app.py
from passporteye import read_mrz

def extract_mrz(image_bytes: bytes) -> dict:
    """Extract MRZ data using PassportEye."""
    mrz = read_mrz(image_bytes)
    if mrz is None:
        return {"success": False, "error": "MRZ_NOT_FOUND"}

    return {
        "success": True,
        "data": {
            "surname": mrz.surname,
            "names": mrz.names,
            "country": mrz.country,
            "nationality": mrz.nationality,
            "date_of_birth": mrz.date_of_birth,
            "expiration_date": mrz.expiration_date,
            "sex": mrz.sex,
            "number": mrz.number,
            "valid_score": mrz.valid_score
        }
    }
```

### Client Integration

```typescript
// src/lib/extraction/passporteye-client.ts
interface PassportEyeResponse {
  success: boolean;
  data?: {
    surname: string;
    names: string;
    country: string;
    nationality: string;
    date_of_birth: string;
    expiration_date: string;
    sex: string;
    number: string;
    valid_score: number;
  };
  error?: string;
}

async function extractWithPassportEye(imageBase64: string): Promise<PassportEyeResponse> {
  const response = await fetch(process.env.PASSPORTEYE_SERVICE_URL + '/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  });
  return response.json();
}
```

### Environment Variables

```bash
# .env.local
PASSPORTEYE_SERVICE_URL=http://localhost:5001
```

---

## 3. G-28 Extraction: LLM-First Workflow

G-28 forms use **Claude 3.5 Sonnet Vision** as the primary extraction method. This approach handles the complex, variable layout of handwritten and typed form fields.

### Three-Step Workflow

#### Step A: PDF Preprocessing

Convert PDF pages to high-resolution images for optimal LLM vision analysis.

```typescript
import { fromPath } from 'pdf2image';

async function preprocessG28(pdfPath: string): Promise<Buffer[]> {
  const images = await fromPath(pdfPath, {
    density: 300,           // 300 DPI for clear text
    saveFilename: 'page',
    savePath: '/tmp',
    format: 'png',
    width: 2550,            // Letter size at 300 DPI
    height: 3300,
  });
  return images.map(img => img.buffer);
}
```

#### Step B: Claude Vision Analysis

Send preprocessed images to Claude 3.5 Sonnet with a structured extraction prompt.

```typescript
interface G28ExtractionRequest {
  images: string[];  // Base64 encoded images
  model: 'claude-3-5-sonnet-20241022';
}

async function extractG28WithClaude(images: string[]): Promise<G28Data> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    temperature: 0,
    messages: [{
      role: 'user',
      content: [
        ...images.map(img => ({
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: img }
        })),
        { type: 'text', text: G28_EXTRACTION_PROMPT }
      ]
    }]
  });
  return JSON.parse(response.content[0].text);
}
```

#### Step C: Post-Extraction Validation

Validate and normalize extracted data using Zod schemas.

```typescript
const extractedData = await extractG28WithClaude(images);
const validated = G28Schema.safeParse(extractedData);

if (!validated.success) {
  throw new ExtractionError('G28_VALIDATION_FAILED', validated.error);
}

return normalizeG28Data(validated.data);
```

---

### G-28 Claude Prompt Template

```typescript
const G28_EXTRACTION_PROMPT = `
You are a legal document parser specialized in USCIS Form G-28.

## Task
Extract structured data from this G-28 form image. Return ONLY valid JSON.

## Extraction Rules

### Attorney Information (Part 1)
- full_name: Attorney's full name from Part 1
- firm_name: Law firm or organization name
- bar_number: Bar number or license info (if visible)
- email: Attorney's email address

### Representative Type (Part 2, Item 1.a)
- is_eligible_attorney: TRUE if checkbox "I am an attorney eligible to practice law..." is checked
- Note: Check the first checkbox in Part 2, Item 1.a

### Client Information (Part 3)
- family_name: Client's family/last name
- given_name: Client's given/first name
- full_name: Concatenate given_name + family_name
- email: Client's email from Part 3, Item 12
- mobile_phone: Client's phone from Part 3, Item 10
- mailing_address: Parse street, city, state, zip, country from Part 3 mailing address

## Normalization Rules
- Phone numbers: Convert to E.164 format (+1XXXXXXXXXX for US, +61XXXXXXXXX for AU)
- Email: Lowercase, trim whitespace
- State: Use 2-letter abbreviation (CA, NY, WA)
- Country: Full name (Australia, United States)

## Null Handling
If a field is not visible, illegible, or not filled in, use null.

## Response Format
{
  "attorney_info": {
    "full_name": "string | null",
    "firm_name": "string | null",
    "bar_number": "string | null",
    "email": "string | null",
    "is_eligible_attorney": "boolean"
  },
  "client_info": {
    "family_name": "string | null",
    "given_name": "string | null",
    "full_name": "string | null",
    "email": "string | null",
    "mobile_phone": "string | null",
    "mailing_address": {
      "street": "string | null",
      "city": "string | null",
      "state": "string | null",
      "zip": "string | null",
      "country": "string | null",
      "full_formatted": "string | null"
    }
  }
}
`;
```

---

### G-28 Schema Definition

```typescript
import { z } from 'zod';

const MailingAddressSchema = z.object({
  street: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().max(2).nullable(),  // 2-letter state code
  zip: z.string().nullable(),
  country: z.string().nullable(),
  full_formatted: z.string().nullable(),
});

const AttorneyInfoSchema = z.object({
  full_name: z.string().nullable(),
  firm_name: z.string().nullable(),
  bar_number: z.string().nullable(),
  email: z.string().email().nullable(),
  is_eligible_attorney: z.boolean(),
});

const ClientInfoSchema = z.object({
  family_name: z.string().nullable(),
  given_name: z.string().nullable(),
  full_name: z.string().nullable(),
  email: z.string().email().nullable(),
  mobile_phone: z.string().nullable(),  // E.164 format
  mailing_address: MailingAddressSchema,
});

export const G28Schema = z.object({
  attorney_info: AttorneyInfoSchema,
  client_info: ClientInfoSchema,
});

export type G28Data = z.infer<typeof G28Schema>;
```

---

### LLM Configuration

```typescript
interface LLMConfig {
  provider: 'anthropic';
  model: string;              // 'claude-3-5-sonnet-20241022'
  maxTokens: number;
  temperature: number;        // 0 for deterministic extraction
  timeout: number;            // ms
}

const G28_LLM_CONFIG: LLMConfig = {
  provider: 'anthropic',
  model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: 2000,
  temperature: 0,
  timeout: 60000,  // 60s for multi-page forms
};
```

---

### Passport LLM Fallback

For passports where PassportEye and MRZ parsing fail, use NuExtract API as the fallback.

```typescript
const PASSPORT_EXTRACTION_PROMPT = `
Analyze this passport image and extract the following information.
Return ONLY valid JSON with no additional text.

Fields to extract:
- documentType: The document type (usually "P" for passport)
- issuingCountry: Full country name
- surname: Family name / Last name
- givenNames: First and middle names
- documentNumber: Passport number
- nationality: Full country name
- dateOfBirth: Format as YYYY-MM-DD
- sex: M, F, or X
- expirationDate: Format as YYYY-MM-DD

If a field is not visible or unclear, use null.
`;

const PassportSchema = z.object({
  documentType: z.string().nullable(),
  issuingCountry: z.string().nullable(),
  surname: z.string(),
  givenNames: z.string(),
  documentNumber: z.string().nullable(),
  nationality: z.string().nullable(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  sex: z.enum(['M', 'F', 'X']).nullable(),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
```

---

## Country Code Mapping

```typescript
// MRZ uses ISO 3166-1 alpha-3 codes
const COUNTRY_CODES: Record<string, string> = {
  'USA': 'United States',
  'GBR': 'United Kingdom',
  'CAN': 'Canada',
  'AUS': 'Australia',
  'DEU': 'Germany',
  'FRA': 'France',
  'JPN': 'Japan',
  'CHN': 'China',
  'IND': 'India',
  'MEX': 'Mexico',
  // ... comprehensive list
};

function normalizeCountry(code: string): string {
  return COUNTRY_CODES[code.toUpperCase()] || code;
}
```

---

## Error Handling

```typescript
type ExtractionError =
  | { type: 'MRZ_NOT_FOUND'; message: string }
  | { type: 'MRZ_INVALID_CHECK'; message: string; field: string }
  | { type: 'OCR_FAILED'; message: string; provider: string }
  | { type: 'OCR_LOW_CONFIDENCE'; message: string; confidence: number }
  | { type: 'LLM_TIMEOUT'; message: string }
  | { type: 'LLM_INVALID_RESPONSE'; message: string; raw: string }
  | { type: 'VALIDATION_FAILED'; message: string; fields: string[] };

interface ExtractionResult {
  success: boolean;
  data: Partial<PassportData>;
  method: 'mrz' | 'ocr' | 'llm' | 'combined';
  confidence: number;
  errors: ExtractionError[];
  warnings: string[];
}
```

---

## Testing Strategy

### Unit Tests

- MRZ parsing with valid/invalid inputs
- Check digit calculation
- Country code normalization
- Date parsing and validation

### Integration Tests

- OCR provider responses
- LLM API calls (mocked)
- Full pipeline with sample documents

### Test Documents

```
test/fixtures/
├── passports/
│   ├── us_passport_valid.jpg
│   ├── uk_passport_valid.jpg
│   ├── blurry_passport.jpg
│   └── no_mrz_passport.jpg
└── g28/
    ├── g28_filled.pdf
    ├── g28_partial.pdf
    └── g28_handwritten.pdf
```
