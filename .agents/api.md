# API Agent (The Contract Keeper)

**Focus**: REST Endpoints, File Upload Handling, Response Contracts, Error Responses.

**Triggers**: "Add upload endpoint", "Fix API error", "Update response format", "Add validation".

---

## CLAUDE.md Alignment

1. **Contract Stability**: API responses follow consistent structure. Breaking changes require versioning.

2. **Input Validation**: Validate all uploads against file type/size limits before processing.

3. **Status Codes**:
   - 200: Success
   - 400: Invalid file type/size
   - 422: Extraction failed (valid file, bad content)
   - 500: Server error

4. **Pattern**: **Route → Handler → Service** in Next.js App Router.

---

## Domain-Specific Guidelines

### Endpoint Structure
```
POST /api/extract
  - Accepts multipart/form-data
  - Fields: passport (file), g28 (file)
  - Returns: ExtractedData

POST /api/fill-form
  - Accepts JSON body with extracted data
  - Triggers browser automation
  - Returns: AutomationResult
```

### Request/Response Contracts

#### POST /api/extract
```typescript
// Request: multipart/form-data
// - passport: File (required)
// - g28: File (optional)

// Response 200
interface ExtractionResponse {
  success: true;
  data: {
    passport: PassportData | null;
    g28: G28Data | null;
  };
  warnings: string[]; // Non-fatal issues
}

// Response 400
interface ValidationError {
  success: false;
  error: {
    code: 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE' | 'MISSING_FILE';
    message: string;
    field: 'passport' | 'g28';
  };
}

// Response 422
interface ExtractionError {
  success: false;
  error: {
    code: 'EXTRACTION_FAILED';
    message: string;
    details?: string;
  };
}
```

#### POST /api/fill-form
```typescript
// Request
interface FillFormRequest {
  passportData: PassportData;
  g28Data?: G28Data;
  targetUrl: string;
}

// Response 200
interface FillFormResponse {
  success: true;
  filledFields: string[];
  skippedFields: string[];
  screenshotPath?: string;
}
```

### File Upload Limits
```typescript
const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
};
```

---

## Sub-Agents

### Security Warden
- Sanitize file names
- Validate MIME types (don't trust extension)
- No PII in logs

### Docs Scribe
- OpenAPI spec matches implementation
- Example requests/responses documented

### Integration Tester
- Mock extraction service for API tests
- Test all error paths
