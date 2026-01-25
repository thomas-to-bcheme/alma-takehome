# AI/ML Agent (Document Intelligence)

**Focus**: OCR Processing, MRZ Extraction, LLM-Based Data Extraction, Multi-Country Passport Support.

**Triggers**: "Extract passport data", "Parse MRZ", "Use OCR", "Handle foreign passport", "Improve extraction accuracy".

---

## CLAUDE.md Alignment

1. **No Hardcoding**: Model names, API keys, confidence thresholds via environment variables.

2. **Data Integrity**: Store raw OCR/LLM output before parsing. Enable debugging.

3. **Fail Fast**: Handle API rate limits, timeouts gracefully. Return partial data with warnings.

4. **Pattern**: **Chain of Responsibility** - MRZ → OCR → LLM fallback chain.

---

## Domain-Specific Guidelines

### Extraction Strategy Priority
```
1. MRZ (Machine Readable Zone)
   - Most reliable for passports
   - Structured format, easy to parse
   - Works across all countries

2. OCR + Template Matching
   - For G-28 forms (known layout)
   - Field position-based extraction

3. LLM Vision
   - Fallback for unclear documents
   - Handles variations in formatting
   - Cross-validates MRZ results
```

### MRZ Parsing
```typescript
// MRZ Line Format (TD3 - Passport)
// Line 1: P<COUNTRY<<SURNAME<<GIVENNAMES<<<<<<<<<<<<<<<
// Line 2: DOCNUMBER<CHECK<NATIONALITY<DOB<CHECK<SEX<EXPIRY<CHECK<PERSONAL<<<CHECK

interface MRZResult {
  raw: string[];
  parsed: PassportData;
  checkDigitsValid: boolean;
}

// Check digit algorithm: 7-3-1 weighting
function validateCheckDigit(data: string, check: string): boolean;
```

### OCR Configuration
```typescript
interface OCRConfig {
  provider: 'tesseract' | 'google-vision' | 'aws-textract';
  language: string[];
  preprocessImage: boolean; // Deskew, enhance contrast
}
```

### LLM Extraction Prompt Template
```typescript
const PASSPORT_EXTRACTION_PROMPT = `
Extract the following fields from this passport image:
- Document Type
- Issuing Country
- Surname
- Given Names
- Document Number
- Nationality
- Date of Birth (YYYY-MM-DD)
- Sex (M/F/X)
- Expiration Date (YYYY-MM-DD)

Return as JSON. Use null for fields not visible.
`;
```

### Country Code Handling
```typescript
// MRZ uses ISO 3166-1 alpha-3
const COUNTRY_CODES: Record<string, string> = {
  'USA': 'United States',
  'GBR': 'United Kingdom',
  'CHN': 'China',
  // ... comprehensive list
};

// Handle variations
function normalizeCountry(code: string): string;
```

### G-28 Form Field Mapping
```typescript
// Known field positions for standard G-28 layout
const G28_FIELD_REGIONS = {
  attorneyName: { page: 1, region: [x, y, w, h] },
  firmName: { page: 1, region: [x, y, w, h] },
  // ... other fields
};
```

---

## Sub-Agents

### Context Retriever (MRZ Parser)
- Detects MRZ zone in image
- Parses TD1/TD2/TD3 formats
- Validates check digits

### Prompt Architect
- Versioned prompt templates
- Separate system/user instructions
- Output format enforcement (JSON mode)

### Guardrail Sentry
- Validates LLM output against schema
- Retries on malformed responses
- Confidence scoring for extracted fields

---

## Error Handling

```typescript
type ExtractionError =
  | { type: 'MRZ_NOT_FOUND'; message: string }
  | { type: 'OCR_FAILED'; message: string; provider: string }
  | { type: 'LLM_TIMEOUT'; message: string }
  | { type: 'VALIDATION_FAILED'; message: string; fields: string[] };

// Always return partial results when possible
interface ExtractionResult {
  data: Partial<PassportData>;
  confidence: number; // 0-1
  method: 'mrz' | 'ocr' | 'llm';
  errors: ExtractionError[];
}
```
