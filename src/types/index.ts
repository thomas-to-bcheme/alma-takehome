import { z } from 'zod';

// =============================================================================
// FILE VALIDATION TYPES
// =============================================================================

// File validation types
export type AcceptedMimeType = 'application/pdf' | 'image/png' | 'image/jpeg';

export interface FileValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

// =============================================================================
// DOCUMENT TYPES
// =============================================================================

// Document types
export type DocumentType = 'passport' | 'g28';

export interface DocumentFile {
  readonly file: File;
  readonly type: DocumentType;
  readonly previewUrl?: string;
}

// =============================================================================
// UPLOAD STATUS
// =============================================================================

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// =============================================================================
// EXTRACTION TYPES
// =============================================================================

export type ExtractionMethod = 'mrz' | 'nuextract' | 'combined' | 'passporteye';

// Passport data schema (for runtime validation)
export const PassportDataSchema = z.object({
  documentType: z.string(),
  issuingCountry: z.string(),
  surname: z.string(),
  givenNames: z.string(),
  documentNumber: z.string(),
  nationality: z.string(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  sex: z.enum(['M', 'F', 'X']),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

export type PassportData = z.infer<typeof PassportDataSchema>;

// Passport data with extraction metadata (for API responses)
export interface PassportDataWithMetadata extends PassportData {
  readonly extractionMethod: ExtractionMethod;
  readonly confidence: number;
}

// G-28 form data schema (for runtime validation)
export const G28DataSchema = z.object({
  attorneyName: z.string(),
  firmName: z.string(),
  street: z.string(),
  suite: z.string().optional(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  phone: z.string(),
  fax: z.string().optional(),
  email: z.string().email(),
  clientName: z.string(),
  alienNumber: z.string(),
  barNumber: z.string().optional(),
  licensingAuthority: z.string().optional(),
  // Eligibility flags
  isAttorney: z.boolean().optional(),
  isAccreditedRep: z.boolean().optional(),
  organizationName: z.string().optional(),
  accreditationDate: z.string().optional(),
});

export type G28Data = z.infer<typeof G28DataSchema>;

// =============================================================================
// EXTRACTION PIPELINE TYPES
// =============================================================================

export interface ExtractionResult<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly method: ExtractionMethod;
  readonly confidence: number;
  readonly errors: readonly ExtractionError[];
  readonly warnings: readonly string[];
}

export type ExtractionError =
  | { readonly type: 'MRZ_NOT_FOUND'; readonly message: string }
  | { readonly type: 'MRZ_INVALID_CHECK'; readonly message: string; readonly field: string }
  | { readonly type: 'API_ERROR'; readonly message: string; readonly statusCode?: number }
  | { readonly type: 'API_TIMEOUT'; readonly message: string }
  | { readonly type: 'VALIDATION_FAILED'; readonly message: string; readonly fields: readonly string[] }
  | { readonly type: 'INVALID_FILE_TYPE'; readonly message: string }
  | { readonly type: 'FILE_TOO_LARGE'; readonly message: string };

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

// API response types (aligned with backend ExtractApiResponse)
export interface ExtractResponse {
  readonly success: boolean;
  readonly data?: ExtractedData;
  readonly error?: ApiError;
  readonly warnings?: readonly string[];
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly details?: string;
}

export interface ExtractedData {
  readonly passport?: PassportDataWithMetadata;
  readonly g28?: G28Data;
}

// =============================================================================
// FILE VALIDATION (INTERNAL)
// =============================================================================

export interface FileValidation {
  readonly valid: boolean;
  readonly error?: ExtractionError;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// App state for files
export interface AppState {
  readonly passportFile: File | null;
  readonly g28File: File | null;
  readonly uploadStatus: UploadStatus;
  readonly errorMessage: string | null;
  readonly successMessage: string | null;
  readonly extractedData: ExtractedData | null;
}

export interface AppStateContextValue extends AppState {
  setPassportFile: (file: File | null) => void;
  setG28File: (file: File | null) => void;
  setUploadStatus: (status: UploadStatus) => void;
  setErrorMessage: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setExtractedData: (data: ExtractedData | null) => void;
  resetState: () => void;
}

// Helper to format full name from passport data
export function formatFullName(passport: PassportData): string {
  return `${passport.givenNames} ${passport.surname}`.trim();
}

// =============================================================================
// FORM AUTOMATION TYPES
// =============================================================================

export type FieldStatus = 'filled' | 'skipped' | 'failed';

export interface FieldResult {
  readonly fieldName: string;
  readonly status: FieldStatus;
  readonly value?: string;
  readonly error?: string;
}

export interface FormFillResult {
  readonly success: boolean;
  readonly filledFields: readonly FieldResult[];
  readonly skippedFields: readonly FieldResult[];
  readonly failedFields: readonly FieldResult[];
  readonly screenshotBase64?: string;
  readonly durationMs: number;
  readonly error?: string;
}

export type AutomationStatus = 'idle' | 'running' | 'success' | 'error';

export interface AutomationState {
  readonly status: AutomationStatus;
  readonly result: FormFillResult | null;
  readonly errorMessage: string | null;
}
