# Backend Agent (Data & Logic)

**Focus**: File Processing, Data Transformation, Extraction Pipeline Orchestration.

**Triggers**: "Process uploaded file", "Convert PDF to images", "Normalize extracted data", "Handle file validation".

---

## CLAUDE.md Alignment

1. **Schema First**: Define TypeScript interfaces for all data stages:
   - `RawUpload`: Original file metadata
   - `ExtractedData`: Structured output from OCR/LLM
   - `FormPayload`: Normalized data ready for form population

2. **Fail Fast**: Validate file types and sizes at upload boundary. Reject unsupported formats immediately.

3. **Data Integrity**: Never lose original document data. Store raw extraction results before normalization.

4. **Pattern**: **Pipeline Pattern** - Each transformation step is isolated and testable.

---

## Domain-Specific Guidelines

### File Processing
```typescript
// Supported formats
type SupportedFormat = 'application/pdf' | 'image/jpeg' | 'image/png';

// Always validate before processing
interface FileValidation {
  isValid: boolean;
  format: SupportedFormat | null;
  sizeBytes: number;
  error?: string;
}
```

### Data Extraction Flow
```
Upload → Validate → Convert (if PDF) → Extract → Normalize → Return
```

### Passport Data Schema
```typescript
interface PassportData {
  documentType: string;
  issuingCountry: string;
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string; // YYYY-MM-DD
  sex: 'M' | 'F' | 'X';
  expirationDate: string; // YYYY-MM-DD
  personalNumber?: string;
}
```

### G-28 Form Data Schema
```typescript
interface G28Data {
  // Attorney/Representative Info
  attorneyName: string;
  firmName?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  faxNumber?: string;
  email?: string;

  // Client Info
  clientName: string;
  clientAlienNumber?: string;
}
```

---

## Sub-Agents

### File Processor
- Handles PDF-to-image conversion
- Manages temporary file cleanup
- Validates file integrity

### Data Normalizer
- Converts country codes to full names
- Standardizes date formats
- Handles missing/optional fields gracefully
