# Data Flow Documentation

> Reference: `.agents/backend.md`, `.agents/orchestrator.md`

## End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         UPLOAD → EXTRACTION FLOW                              │
└──────────────────────────────────────────────────────────────────────────────┘

User selects files
       │
       ▼
┌──────────────┐
│  Client      │  Validates file type/size client-side
│  Validation  │  Accepted: PDF, JPEG, PNG (max 10MB)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  FormData    │  passport: File (required)
│  Upload      │  g28: File (optional)
└──────┬───────┘
       │ POST /api/extract (multipart/form-data)
       ▼
┌──────────────┐
│  Server      │  MIME type validation (don't trust extension)
│  Validation  │  Size check, sanitize filename
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PDF         │  If PDF → Convert to images (one per page)
│  Conversion  │  Store originals for audit trail
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Extraction  │  1. Try MRZ parsing (most reliable)
│  Pipeline    │  2. Fall back to OCR
│              │  3. Fall back to LLM vision
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Data        │  Normalize country codes, dates
│  Normalization│  Validate against schema
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Response    │  { success, data: { passport, g28 }, warnings }
└──────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                         EXTRACTION → FORM FILL FLOW                           │
└──────────────────────────────────────────────────────────────────────────────┘

User reviews extracted data
       │
       ▼
┌──────────────┐
│  Manual      │  User can edit/correct any field
│  Correction  │  before triggering form fill
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Confirm     │  User clicks "Fill Form" button
│  Action      │
└──────┬───────┘
       │ POST /api/fill-form (JSON)
       ▼
┌──────────────┐
│  Playwright  │  Launch browser (headless or visible)
│  Init        │  Navigate to target form URL
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Form        │  Map extracted data to form fields
│  Population  │  Handle different input types
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Verification│  Take screenshot
│              │  Return filled/skipped fields
└──────┬───────┘
       │ ⚠️ DO NOT SUBMIT
       ▼
┌──────────────┐
│  Response    │  { success, filledFields, skippedFields, screenshot }
└──────────────┘
```

## Data Schemas

### Stage 1: Raw Upload

```typescript
interface RawUpload {
  file: File;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
}
```

### Stage 2: Extracted Data

```typescript
interface PassportData {
  documentType: string;
  issuingCountry: string;      // Full name (not code)
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;         // YYYY-MM-DD
  sex: 'M' | 'F' | 'X';
  expirationDate: string;      // YYYY-MM-DD
  personalNumber?: string;

  // Metadata
  extractionMethod: 'mrz' | 'ocr' | 'llm';
  confidence: number;          // 0-1
  rawMrz?: string[];           // Original MRZ lines if available
}

interface G28Data {
  // Attorney/Representative
  attorneyName: string;
  firmName?: string;
  address: Address;
  phone: string;
  faxNumber?: string;
  email?: string;

  // Client
  clientName: string;
  clientAlienNumber?: string;
  uscisAccountNumber?: string;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
```

### Stage 3: Form Payload

```typescript
interface FormPayload {
  // Mapped to specific form field IDs
  fields: Record<string, string>;

  // Source tracking
  source: {
    passport: boolean;
    g28: boolean;
  };
}
```

## Error States

| Stage | Error Type | Handling |
|-------|------------|----------|
| Upload | Invalid file type | 400 + message |
| Upload | File too large | 400 + message |
| Extraction | MRZ not found | Fall back to OCR |
| Extraction | OCR failed | Fall back to LLM |
| Extraction | LLM timeout | Return partial data |
| Form Fill | Element not found | Skip field + report |
| Form Fill | Navigation failed | 500 + retry suggestion |

## Data Integrity Rules

1. **Never lose raw data**: Store original extraction output before normalization
2. **Audit trail**: Log extraction method and confidence for each field
3. **Validation chain**: Each stage validates output before passing downstream
4. **Partial success**: Always return what was successfully extracted
