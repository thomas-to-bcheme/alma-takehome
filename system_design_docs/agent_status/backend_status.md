# Backend Agent Status Report

**Generated:** 2026-01-28
**Agent:** Backend/Data Processing
**Repository:** Alma Document Automation

---

## Executive Summary

The Alma backend implements a document extraction and form automation pipeline for immigration documents (passports and G-28 forms). The architecture is well-organized with clear separation of concerns, comprehensive Zod schema validation, and a multi-service extraction strategy with intelligent fallbacks.

---

## Current State

### Directory Structure

```
src/
├── lib/
│   ├── index.ts                    # Barrel exports
│   ├── constants.ts                # Centralized constants
│   ├── utils.ts                    # Utility functions
│   ├── mapExtractedToForm.ts       # Data transformation layer
│   ├── config/
│   │   └── extraction.ts           # Environment config with Zod validation
│   ├── validation/
│   │   └── formA28Schema.ts        # Form schema (Zod)
│   ├── extraction/
│   │   ├── index.ts                # Extraction barrel exports
│   │   ├── pipeline.ts             # Orchestration layer
│   │   ├── templates.ts            # NuExtract JSON templates
│   │   ├── mrz/
│   │   │   └── parser.ts           # MRZ parsing (TD3 passports)
│   │   ├── nuextract-client.ts     # NuExtract API client
│   │   ├── passporteye-client.ts   # PassportEye microservice client
│   │   ├── claude-vision-client.ts # Direct Claude API client
│   │   ├── g28-claude-client.ts    # Docker Claude service client
│   │   └── pdf-converter-client.ts # PDF to images conversion
│   ├── automation/
│   │   ├── index.ts                # Automation barrel exports
│   │   ├── field-mappings.ts       # JSON config loader
│   │   ├── form-fill-client.ts     # Remote automation client
│   │   ├── local-playwright.ts     # Local Playwright runner
│   │   └── page-objects/
│   │       └── FormA28Page.ts      # Page Object Model
│   └── __tests__/
│       ├── mrz-parser.test.ts      # MRZ parser tests
│       └── pipeline-utils.test.ts  # Normalization tests
├── types/
│   └── index.ts                    # Centralized type definitions
├── app/api/
│   ├── extract/route.ts            # POST /api/extract
│   ├── extract-g28/route.ts        # POST /api/extract-g28
│   ├── fill-form/route.ts          # Remote form fill
│   └── fill-form-local/route.ts    # Local Playwright fill
└── shared/
    └── field-mappings.json         # Form field configuration
```

### Service Dependencies

| Service | Purpose | Config Env Var |
|---------|---------|----------------|
| NuExtract API | Fallback document extraction | `NUEXTRACT_API_URL`, `NUEXTRACT_API_KEY` |
| PassportEye | Primary passport MRZ extraction | `PASSPORTEYE_API_URL` |
| Claude Vision (direct) | G-28 form extraction | `ANTHROPIC_API_KEY` |
| PDF Converter | PDF to page images | `G28_CLAUDE_API_URL` |
| Form Automation | Remote browser automation | `FORM_AUTOMATION_API_URL` |

---

## Patterns Found

### 1. Extraction Pipeline Pattern

The extraction system implements a **cascading fallback strategy**:

**Passport Extraction:**
```
PassportEye (OCR+MRZ) -> MRZ Parser (if OCR text) -> NuExtract API (fallback)
```

**G-28 Extraction:**
```
Claude Vision API (page-by-page) -> No fallback (explicit errors)
```

Key characteristics:
- Each extraction method returns a standardized `ExtractionResult<T>` type
- Confidence scores accompany all results
- Warnings accumulate across fallback attempts
- PDF documents are converted to page images before extraction

### 2. Zod Schema Validation

Comprehensive schema validation at multiple layers:

| Location | Schema | Purpose |
|----------|--------|---------|
| `/src/types/index.ts` | `PassportDataSchema`, `G28DataSchema` | Runtime extraction validation |
| `/src/lib/validation/formA28Schema.ts` | `formA28Schema` | Complete form validation with refinements |
| `/src/lib/config/extraction.ts` | `ExtractionConfigSchema` | Environment config validation |

### 3. Data Transformation Layer

`/src/lib/mapExtractedToForm.ts` handles:
- Mapping extracted passport data to form fields
- Mapping G-28 attorney/client data to form fields
- Name parsing (handles "Last, First Middle" and "First Middle Last")
- Merging G-28 and passport data with passport taking precedence

### 4. Configuration Pattern

Singleton config with lazy loading:
```typescript
let _config: ExtractionConfig | null = null;
export function getExtractionConfig(): ExtractionConfig {
  if (!_config) _config = loadExtractionConfig();
  return _config;
}
```

### 5. Page Object Model (Automation)

The `FormA28Page` class encapsulates:
- Field type handlers (text, select, checkbox, radio, date)
- Result tracking (filled/skipped/failed arrays)
- Screenshot capture
- Submission prevention verification

---

## Data Schemas

### Core Types (`/src/types/index.ts`)

```typescript
// Passport extraction output
interface PassportData {
  documentType: string;
  issuingCountry: string;
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;      // YYYY-MM-DD
  sex: 'M' | 'F' | 'X';
  expirationDate: string;   // YYYY-MM-DD
}

// G-28 extraction output
interface G28Data {
  attorneyName: string;
  firmName: string;
  street: string;
  suite?: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email: string;
  clientName: string;
  barNumber?: string;
  licensingAuthority?: string;
  isAttorney?: boolean;
  isAccreditedRep?: boolean;
}

// Pipeline result wrapper
interface ExtractionResult<T> {
  success: boolean;
  data: T | null;
  method: ExtractionMethod;
  confidence: number;
  errors: readonly ExtractionError[];
  warnings: readonly string[];
}
```

### Form Schema (`/src/lib/validation/formA28Schema.ts`)

The form schema covers 5 parts with conditional validation:
- Part 1: Attorney Information (15 fields)
- Part 2: Eligibility (11 fields with conditional refinements)
- Part 3: Passport/Client Information (12 fields)
- Part 4: Client Consent (7 fields)
- Part 5: Attorney Signature (3 fields)

Notable refinements:
```typescript
.refine(data => !data.isAttorney || data.barNumber, {
  message: 'Bar number is required for attorneys',
  path: ['barNumber'],
})
```

---

## Data Normalization

### Date Normalization (`pipeline.ts`)

```typescript
export function normalizeDate(dateStr: string | null): string | null {
  // Handles: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD.MM.YYYY
  // Output: YYYY-MM-DD or null
}
```

### Sex Normalization (`pipeline.ts`)

```typescript
export function normalizeSex(sex: string | null): 'M' | 'F' | 'X' | null {
  // Normalizes: M/MALE -> M, F/FEMALE -> F, X/OTHER -> X
}
```

### Country Code Normalization (`mrz/parser.ts`)

ISO 3166-1 alpha-3 to full names:
```typescript
const COUNTRY_CODES: Record<string, string> = {
  USA: 'United States',
  GBR: 'United Kingdom',
  // ... 40+ country mappings
};
```

### Phone Number Normalization

**Gap identified:** No phone number normalization exists. G-28 extraction returns raw phone strings.

---

## Quality Assessment

### Strengths

1. **Type Safety**
   - All types use `readonly` modifiers for immutability
   - Zod schemas provide runtime validation
   - Discriminated unions for error types
   - No `any` types (one justified `eslint-disable` in merge function)

2. **Error Handling**
   - Custom error classes with error codes (`NuExtractError`, `PassportEyeError`, etc.)
   - Comprehensive error classification (TIMEOUT, API_ERROR, BILLING_ERROR, etc.)
   - Non-throwing extraction pipeline (returns errors in result object)

3. **Test Coverage**
   - MRZ parser thoroughly tested (check digits, date parsing, line detection)
   - Normalization functions have edge case coverage
   - Tests use Vitest with clear describe/it structure

4. **Configuration**
   - Environment-driven with Zod validation
   - Sensible defaults from constants
   - Clear enable/disable flags per service

5. **Code Organization**
   - Clear barrel exports
   - Logical module separation
   - Shared JSON configuration for field mappings

### Areas for Improvement

1. **Phone Number Handling**
   - No normalization for phone/fax numbers
   - International format not handled
   - US format not enforced

2. **Date Ambiguity**
   - `DD/MM/YYYY` assumed for international dates
   - No locale awareness
   - Could cause US/EU date confusion

3. **Error Recovery**
   - G-28 extraction has no fallback (by design, but risky)
   - PDF conversion failure stops entire extraction

4. **Logging**
   - Uses `console.log/error` directly
   - No structured logging
   - PII could leak in debug logs

5. **Test Gaps**
   - No integration tests for extraction pipeline
   - No tests for Claude Vision client
   - No tests for form automation

6. **Type Duplication**
   - `FormFillResult` defined in both types/index.ts and local-playwright.ts
   - Minor inconsistencies in field naming

7. **Configuration Validation Timing**
   - Config loads lazily on first use
   - Could delay startup failures

---

## Recommendations

### High Priority

1. **Add Phone Number Normalization**
   ```typescript
   // Recommended location: /src/lib/extraction/pipeline.ts
   export function normalizePhone(phone: string | null): string | null {
     if (!phone) return null;
     const digits = phone.replace(/\D/g, '');
     if (digits.length === 10) {
       return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
     }
     if (digits.length === 11 && digits[0] === '1') {
       return `${digits.slice(1,4)}-${digits.slice(4,7)}-${digits.slice(7)}`;
     }
     return phone; // Return original if unrecognized
   }
   ```

2. **Add Structured Logging**
   - Replace console.log with a logging utility
   - Redact PII before logging
   - Add request correlation IDs

3. **Consolidate Type Definitions**
   - Move `FormFillResult` from local-playwright.ts to types/index.ts
   - Ensure single source of truth

### Medium Priority

4. **Add Integration Tests**
   ```typescript
   // /src/lib/__tests__/extraction-pipeline.integration.test.ts
   describe('Extraction Pipeline Integration', () => {
     it('should extract passport with PassportEye fallback', async () => {});
     it('should extract G-28 with Claude Vision', async () => {});
     it('should handle PDF conversion for multi-page G-28', async () => {});
   });
   ```

5. **Improve Date Parsing**
   - Add explicit format detection
   - Consider using date-fns or dayjs for robust parsing
   - Document expected input formats

6. **Add Startup Validation**
   ```typescript
   // In app initialization
   try {
     loadExtractionConfig();
   } catch (error) {
     console.error('Missing configuration:', error.message);
     process.exit(1);
   }
   ```

### Low Priority

7. **Add Retry Logic**
   - Implement exponential backoff for API calls
   - Consider using a retry library like p-retry

8. **Add Request Tracing**
   - Generate trace IDs for extraction requests
   - Pass through to microservices

9. **Document API Contracts**
   - Add OpenAPI/Swagger specs for API routes
   - Document expected request/response formats

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `/Users/tto/Desktop/alma/src/types/index.ts` | 215 | Core type definitions |
| `/Users/tto/Desktop/alma/src/lib/validation/formA28Schema.ts` | 249 | Form validation schema |
| `/Users/tto/Desktop/alma/src/lib/extraction/pipeline.ts` | 450 | Extraction orchestration |
| `/Users/tto/Desktop/alma/src/lib/extraction/mrz/parser.ts` | 302 | MRZ parsing logic |
| `/Users/tto/Desktop/alma/src/lib/extraction/claude-vision-client.ts` | 185 | Claude API integration |
| `/Users/tto/Desktop/alma/src/lib/config/extraction.ts` | 131 | Configuration management |
| `/Users/tto/Desktop/alma/src/lib/mapExtractedToForm.ts` | 164 | Data transformation |
| `/Users/tto/Desktop/alma/src/lib/automation/page-objects/FormA28Page.ts` | 234 | Page Object Model |
| `/Users/tto/Desktop/alma/shared/field-mappings.json` | 276 | Form field configuration |

---

## Conclusion

The backend codebase demonstrates solid engineering practices with strong type safety, clear module boundaries, and comprehensive validation. The extraction pipeline is well-architected with appropriate fallback strategies. Priority improvements should focus on phone number normalization, structured logging, and integration test coverage to ensure production reliability.
