# API Specification

> Reference: `.agents/api.md`

## Base URL

```
Development: http://localhost:3000/api
Production:  https://<your-domain>/api
```

## Endpoints

---

### POST /api/extract

Extract data from uploaded passport and/or G-28 documents.

#### Request

```
Content-Type: multipart/form-data
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passport` | File | Yes | Passport image/PDF |
| `g28` | File | No | G-28 form image/PDF |

**Accepted formats:** `application/pdf`, `image/jpeg`, `image/png`
**Max file size:** 10MB per file

#### Response 200 (Success)

```json
{
  "success": true,
  "data": {
    "passport": {
      "documentType": "P",
      "issuingCountry": "United States",
      "surname": "DOE",
      "givenNames": "JOHN MICHAEL",
      "documentNumber": "123456789",
      "nationality": "United States",
      "dateOfBirth": "1990-05-15",
      "sex": "M",
      "expirationDate": "2030-05-14",
      "extractionMethod": "mrz",
      "confidence": 0.98
    },
    "g28": {
      "attorneyName": "Jane Smith",
      "firmName": "Smith Immigration Law",
      "address": {
        "street": "123 Legal Ave",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "United States"
      },
      "phone": "(212) 555-1234",
      "clientName": "John Doe"
    }
  },
  "warnings": []
}
```

#### Response 400 (Validation Error)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File must be PDF, JPEG, or PNG",
    "field": "passport"
  }
}
```

| Error Code | Description |
|------------|-------------|
| `INVALID_FILE_TYPE` | Unsupported MIME type |
| `FILE_TOO_LARGE` | Exceeds 10MB limit |
| `MISSING_FILE` | Required passport file not provided |

#### Response 422 (Extraction Error)

```json
{
  "success": false,
  "error": {
    "code": "EXTRACTION_FAILED",
    "message": "Could not extract data from passport",
    "details": "MRZ not detected, OCR returned low confidence"
  },
  "partialData": {
    "passport": {
      "surname": "DOE",
      "confidence": 0.45
    }
  }
}
```

---

### POST /api/fill-form

Trigger browser automation to fill the target form.

#### Request

```
Content-Type: application/json
```

```json
{
  "passportData": {
    "surname": "DOE",
    "givenNames": "JOHN MICHAEL",
    "dateOfBirth": "1990-05-15",
    "nationality": "United States",
    "documentNumber": "123456789",
    "sex": "M",
    "expirationDate": "2030-05-14"
  },
  "g28Data": {
    "attorneyName": "Jane Smith",
    "firmName": "Smith Immigration Law"
  },
  "options": {
    "headless": true,
    "screenshot": true
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passportData` | PassportData | Yes | Extracted passport fields |
| `g28Data` | G28Data | No | Extracted G-28 fields |
| `options.headless` | boolean | No | Run browser headless (default: true) |
| `options.screenshot` | boolean | No | Take screenshot after fill (default: true) |

#### Response 200 (Success)

```json
{
  "success": true,
  "filledFields": [
    "lastName",
    "firstName",
    "dateOfBirth",
    "nationality",
    "passportNumber"
  ],
  "skippedFields": [
    {
      "field": "middleName",
      "reason": "No data provided"
    }
  ],
  "screenshotUrl": "/screenshots/fill-1706187600000.png"
}
```

#### Response 500 (Automation Error)

```json
{
  "success": false,
  "error": {
    "code": "AUTOMATION_FAILED",
    "message": "Failed to navigate to form",
    "details": "Timeout waiting for page load"
  }
}
```

---

## Common Response Headers

```
Content-Type: application/json
X-Request-Id: <uuid>
```

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/extract` | 10 requests/minute |
| `/api/fill-form` | 5 requests/minute |

## Error Response Format

All error responses follow this structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;      // Machine-readable error code
    message: string;   // Human-readable message
    field?: string;    // Which input caused the error
    details?: string;  // Additional context
  };
  partialData?: any;   // Any data successfully extracted
}
```

## Security Considerations

1. **File Validation**: MIME type checked server-side (don't trust extension)
2. **Filename Sanitization**: Remove path traversal characters
3. **Size Limits**: Enforced before processing
4. **No PII in Logs**: Scrub sensitive data before logging
5. **Temp File Cleanup**: Delete uploaded files after processing
