# API Agent Status Report

**Generated:** 2026-01-28
**Repository:** Alma Document Automation
**Scope:** `src/app/api/` - Next.js Route Handlers

---

## Current State

### Endpoint Inventory

| Endpoint | Method | Content-Type | Purpose | Status |
|----------|--------|--------------|---------|--------|
| `/api/extract` | POST | multipart/form-data | Extract data from passport + optional G-28 | Active |
| `/api/extract-g28` | POST | multipart/form-data | Extract data from G-28 only | Active |
| `/api/fill-form` | POST, GET | application/json | Fill target form via remote automation service | Active |
| `/api/fill-form-local` | POST, GET | application/json | Fill target form via local Playwright | Active (dev/debug) |

### Endpoint Details

#### POST /api/extract
- **Location:** `/Users/tto/Desktop/alma/src/app/api/extract/route.ts`
- **Input:** `multipart/form-data` with `passport` (required) and `g28` (optional) files
- **Output:** `ExtractResponse` with passport and G-28 data
- **File Validation:** MIME type check (PDF, PNG, JPEG), size limit (10MB)

#### POST /api/extract-g28
- **Location:** `/Users/tto/Desktop/alma/src/app/api/extract-g28/route.ts`
- **Input:** `multipart/form-data` with `g28` (required) file
- **Output:** `ExtractResponse` with G-28 data only
- **Purpose:** Allows G-28 extraction without passport requirement

#### POST /api/fill-form
- **Location:** `/Users/tto/Desktop/alma/src/app/api/fill-form/route.ts`
- **Input:** JSON with `formData: FormA28Data`
- **Output:** `FillFormResponse` with success status and result data
- **Health Check:** GET endpoint returns service availability status

#### POST /api/fill-form-local
- **Location:** `/Users/tto/Desktop/alma/src/app/api/fill-form-local/route.ts`
- **Input:** JSON with `formData: FormA28Data` and optional `options: { headless?, slowMo? }`
- **Output:** `FillFormLocalResponse` with screenshot and field statistics
- **Purpose:** Development/debugging with local Playwright

---

## Patterns Found

### Validation Pattern

**Zod Schema Usage:**
```typescript
// JSON endpoints use Zod schemas for request validation
const FillFormRequestSchema = z.object({
  formData: formA28Schema,
});

const parseResult = FillFormRequestSchema.safeParse(body);
if (!parseResult.success) {
  // Return 400 with field-level error details
}
```

**File Validation (multipart/form-data):**
```typescript
// Manual type guards and validation functions
function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType
function validateFile(file: File): FileValidation
```

### Error Handling Pattern

**Consistent Error Response Structure:**
```typescript
interface ApiError {
  readonly code: string;      // Machine-readable error code
  readonly message: string;   // Human-readable message
  readonly field?: string;    // Which field failed (for file uploads)
  readonly details?: string;  // Additional context
}
```

**Error Logging (PII-Safe):**
```typescript
console.error('Extract API error:', {
  message: error instanceof Error ? error.message : 'Unknown error',
  timestamp: new Date().toISOString(),
});
```

### Response Format Pattern

**Success Response:**
```typescript
{
  success: true,
  data: { /* extracted/processed data */ },
  warnings?: string[]
}
```

**Error Response:**
```typescript
{
  success: false,
  error: { code, message, field?, details? },
  warnings?: string[]
}
```

---

## Contracts

### Request Schemas

#### FormA28Data (formA28Schema)
**Location:** `/Users/tto/Desktop/alma/src/lib/validation/formA28Schema.ts`

Key sections:
- Part 1: Attorney/Representative Info (name, address, contact)
- Part 2: Eligibility (attorney, accredited rep, law student flags)
- Part 3: Passport/Client Info (passport data + personal info)
- Part 4: Client Consent (notification preferences, signature date)
- Part 5: Attorney Signature (declaration, signature date)

Includes conditional validation refinements:
- Bar number required if `isAttorney` is true
- Organization name required if `isAccreditedRep` is true
- Accreditation date required if `isAccreditedRep` is true
- Law student name required if `isLawStudent` is true

#### PassportDataSchema
**Location:** `/Users/tto/Desktop/alma/src/types/index.ts`
```typescript
{
  documentType: string,
  issuingCountry: string,
  surname: string,
  givenNames: string,
  documentNumber: string,
  nationality: string,
  dateOfBirth: string,  // YYYY-MM-DD
  sex: 'M' | 'F' | 'X',
  expirationDate: string  // YYYY-MM-DD
}
```

#### G28DataSchema
**Location:** `/Users/tto/Desktop/alma/src/types/index.ts`
```typescript
{
  attorneyName: string,
  firmName: string,
  street: string,
  suite?: string,
  city: string,
  state: string,
  zipCode: string,
  phone?: string,
  fax?: string,
  email: string,
  clientName: string,
  barNumber?: string,
  licensingAuthority?: string,
  isAttorney?: boolean,
  isAccreditedRep?: boolean,
  organizationName?: string,
  accreditationDate?: string,
  clientPhone?: string,
  clientEmail?: string
}
```

### Response Schemas

#### ExtractResponse
```typescript
{
  success: boolean,
  data?: {
    passport?: PassportDataWithMetadata,
    g28?: G28Data
  },
  error?: ApiError,
  warnings?: string[]
}
```

#### FillFormResponse
```typescript
{
  success: boolean,
  data?: FormFillResult,
  error?: { code: string, message: string, details?: string }
}
```

---

## HTTP Status Code Usage

| Status | Usage | Endpoints |
|--------|-------|-----------|
| **200** | Successful operation | All endpoints on success |
| **400** | Validation errors (missing file, invalid type/size, invalid JSON) | All endpoints |
| **422** | Extraction/processing failed (valid input, but couldn't process) | extract, extract-g28, fill-form |
| **500** | Internal server errors, unexpected exceptions | All endpoints |
| **503** | Service disabled (automation not enabled) | fill-form, fill-form-local |
| **504** | Timeout (automation service took too long) | fill-form |

**Status Code Mapping in fill-form:**
```typescript
const statusCode =
  error.code === 'DISABLED' ? 503 :
  error.code === 'TIMEOUT' ? 504 :
  error.statusCode ?? 500;
```

---

## Middleware

**Finding:** No custom middleware file exists in `src/middleware.ts`.

The API relies on:
- Next.js built-in request handling
- Per-route validation logic
- Manual error handling in each route handler

---

## Quality Assessment

### Strengths

1. **Consistent Response Format:** All endpoints follow the same `{ success, data?, error?, warnings? }` structure
2. **Strong Input Validation:** JSON endpoints use Zod schemas with safeParse for type-safe validation
3. **Field-Level Error Details:** Zod errors are transformed into user-friendly messages with field paths
4. **Immutable Types:** Extensive use of `readonly` modifiers in interfaces
5. **PII-Safe Logging:** Error logging explicitly excludes sensitive data
6. **Semantic HTTP Status Codes:** Proper differentiation between 400 (invalid input), 422 (valid but unprocessable), 500 (server error), 503 (service unavailable)
7. **Service Availability Checks:** Health check endpoints (GET) for automation services
8. **Typed Error Classes:** Custom `FormFillError` with error codes for structured error handling
9. **Timeout Handling:** AbortController pattern for API call timeouts
10. **Graceful Degradation:** Warnings array allows partial success reporting

### Areas for Improvement

1. **Duplicated File Validation Logic:**
   - `validateFile()` and `isAcceptedMimeType()` are duplicated in `extract/route.ts` and `extract-g28/route.ts`
   - Should be extracted to shared utility

2. **No Middleware:**
   - Missing centralized middleware for:
     - Rate limiting
     - Request logging
     - Authentication/authorization (if needed)
     - CORS handling
     - Request ID tracking

3. **Inconsistent Type Exports:**
   - `FillFormResponse` and `FillFormLocalResponse` are defined inline in route files
   - Should be centralized in `/src/types/index.ts`

4. **Missing OpenAPI/Swagger Documentation:**
   - No automated API documentation generation
   - JSDoc comments exist but not machine-parseable for API docs

5. **No Request Body Size Limit for JSON:**
   - JSON endpoints don't validate body size
   - Could be vulnerable to oversized payloads

6. **Error Code Constants Partial Coverage:**
   - `ERROR_CODES` in constants.ts doesn't include all codes used (`VALIDATION_ERROR`, `SERVICE_DISABLED`, etc.)

7. **Health Check Inconsistency:**
   - `/api/fill-form-local` GET returns `{ status: 'healthy' }` but `/api/fill-form` does not
   - Inconsistent health check response format

8. **No API Versioning:**
   - Endpoints are not versioned (e.g., `/api/v1/extract`)
   - Breaking changes would affect all clients

---

## Recommendations

### Priority 1: Code Organization

**Extract Shared File Validation:**
```typescript
// src/lib/validation/fileValidation.ts
export function validateFile(file: File): FileValidation
export function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType
```

**Centralize Response Types:**
```typescript
// src/types/api.ts
export interface FillFormResponse { ... }
export interface FillFormLocalResponse { ... }
export interface HealthCheckResponse { ... }
```

### Priority 2: Middleware Implementation

**Create src/middleware.ts:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();

  // Add request tracking
  response.headers.set('X-Request-ID', requestId);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### Priority 3: Error Code Standardization

**Update ERROR_CODES constant:**
```typescript
export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  MISSING_FILE: 'MISSING_FILE',

  // Processing
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  FILL_FAILED: 'FILL_FAILED',

  // Service
  SERVICE_DISABLED: 'SERVICE_DISABLED',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
```

### Priority 4: Health Check Standardization

**Consistent health check format:**
```typescript
interface HealthCheckResponse {
  service: string;
  enabled: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: string;
}
```

### Priority 5: API Documentation

**Add OpenAPI spec generation:**
- Consider `next-swagger-doc` or `openapi-typescript` for type-safe API documentation
- Document endpoints in JSDoc format compatible with spec generation

---

## File References

| File | Purpose |
|------|---------|
| `/Users/tto/Desktop/alma/src/app/api/extract/route.ts` | Passport + G-28 extraction endpoint |
| `/Users/tto/Desktop/alma/src/app/api/extract-g28/route.ts` | G-28-only extraction endpoint |
| `/Users/tto/Desktop/alma/src/app/api/fill-form/route.ts` | Remote form automation endpoint |
| `/Users/tto/Desktop/alma/src/app/api/fill-form-local/route.ts` | Local Playwright endpoint |
| `/Users/tto/Desktop/alma/src/types/index.ts` | Core type definitions and Zod schemas |
| `/Users/tto/Desktop/alma/src/lib/validation/formA28Schema.ts` | Form A-28 validation schema |
| `/Users/tto/Desktop/alma/src/lib/constants.ts` | Error codes, file limits, defaults |
| `/Users/tto/Desktop/alma/src/lib/config/extraction.ts` | Service configuration loading |
| `/Users/tto/Desktop/alma/src/lib/automation/form-fill-client.ts` | Form automation API client |
| `/Users/tto/Desktop/alma/src/lib/automation/local-playwright.ts` | Local Playwright implementation |

---

## Alignment with api.md Agent Guidelines

| Guideline | Status | Notes |
|-----------|--------|-------|
| Contract Stability | Partial | Types defined but no versioning |
| Input Validation with Zod | Yes | All JSON endpoints validated |
| Semantic HTTP Status Codes | Yes | 200, 400, 422, 500, 503, 504 used correctly |
| Route -> Validate -> Process -> Respond | Yes | Pattern followed consistently |
| Error response standardization | Yes | Consistent `{ code, message, field?, details? }` |

---

## Summary

The API layer demonstrates solid foundational patterns with consistent error handling, proper status codes, and strong type safety through Zod validation. The main opportunities for improvement are reducing code duplication (file validation), adding middleware for cross-cutting concerns, and standardizing service health checks. The codebase follows the api.md agent guidelines well, with room to add API versioning for long-term contract stability.
