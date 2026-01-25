# Document Extraction Pipeline

> Reference: `.agents/ai-ml.md`

## Overview

Multi-strategy extraction system that uses MRZ parsing, OCR, and LLM vision to extract data from passport and G-28 documents.

## Extraction Strategy Priority

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTRACTION PIPELINE                          │
└─────────────────────────────────────────────────────────────────┘

Document Input
      │
      ▼
┌─────────────────┐
│  1. MRZ PARSING │  ◄── Highest accuracy, structured format
│    (Passport)   │      Works for all ICAO-compliant passports
└────────┬────────┘
         │ MRZ found?
    Yes ─┤
         │ No
         ▼
┌─────────────────┐
│  2. OCR ENGINE  │  ◄── Template-based for G-28
│                 │      Field position matching
└────────┬────────┘
         │ High confidence?
    Yes ─┤
         │ No
         ▼
┌─────────────────┐
│  3. LLM VISION  │  ◄── Fallback for unclear documents
│    (Claude/GPT) │      Handles formatting variations
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NORMALIZATION  │  ◄── Country codes, dates, validation
└─────────────────┘
```

---

## 1. MRZ Parsing

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

## 2. OCR Engine

### Provider Options

| Provider | Pros | Cons |
|----------|------|------|
| Tesseract | Free, local | Lower accuracy |
| Google Vision | High accuracy | Cost per request |
| AWS Textract | Form extraction | Cost, AWS lock-in |

### Configuration

```typescript
interface OCRConfig {
  provider: 'tesseract' | 'google-vision' | 'aws-textract';
  language: string[];           // ['eng'] for English
  preprocessImage: boolean;     // Deskew, enhance contrast
  confidence_threshold: number; // Minimum confidence (0-1)
}

const DEFAULT_CONFIG: OCRConfig = {
  provider: 'tesseract',
  language: ['eng'],
  preprocessImage: true,
  confidence_threshold: 0.7,
};
```

### Image Preprocessing

```typescript
async function preprocessImage(image: Buffer): Promise<Buffer> {
  // 1. Convert to grayscale
  // 2. Deskew (correct rotation)
  // 3. Enhance contrast
  // 4. Remove noise
  // 5. Binarize (black/white)
  return processedImage;
}
```

### G-28 Field Regions

```typescript
// Known field positions for standard G-28 layout
const G28_FIELD_REGIONS: Record<string, FieldRegion> = {
  attorneyName: {
    page: 1,
    region: { x: 50, y: 200, width: 300, height: 30 },
    label: "Attorney Name",
  },
  firmName: {
    page: 1,
    region: { x: 50, y: 250, width: 300, height: 30 },
    label: "Firm Name",
  },
  // ... other fields
};

interface FieldRegion {
  page: number;
  region: { x: number; y: number; width: number; height: number };
  label: string;
}
```

---

## 3. LLM Vision Extraction

### Prompt Template

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

Example response:
{
  "documentType": "P",
  "issuingCountry": "United States",
  "surname": "DOE",
  "givenNames": "JOHN MICHAEL",
  "documentNumber": "123456789",
  "nationality": "United States",
  "dateOfBirth": "1990-05-15",
  "sex": "M",
  "expirationDate": "2030-05-14"
}
`;
```

### G-28 Prompt Template

```typescript
const G28_EXTRACTION_PROMPT = `
Analyze this G-28 immigration form and extract the following information.
Return ONLY valid JSON with no additional text.

Fields to extract:
- attorneyName: Full name of attorney or representative
- firmName: Law firm or organization name (null if individual)
- street: Street address
- city: City
- state: State (2-letter code)
- zipCode: ZIP code
- phone: Phone number
- email: Email address (null if not visible)
- clientName: Name of the client/applicant
- alienNumber: A-Number if present (null if not visible)

If a field is not visible or unclear, use null.
`;
```

### LLM Configuration

```typescript
interface LLMConfig {
  provider: 'anthropic' | 'openai';
  model: string;              // e.g., 'claude-3-sonnet-20240229'
  maxTokens: number;
  temperature: number;        // 0 for deterministic extraction
  timeout: number;            // ms
}

const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'anthropic',
  model: process.env.LLM_MODEL || 'claude-3-sonnet-20240229',
  maxTokens: 1000,
  temperature: 0,
  timeout: 30000,
};
```

### Response Validation

```typescript
import { z } from 'zod';

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

// Validate LLM response
function validateExtraction(data: unknown): PassportData | null {
  const result = PassportSchema.safeParse(data);
  return result.success ? result.data : null;
}
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
