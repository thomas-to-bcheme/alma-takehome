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

export type ExtractionMethod = 'mrz' | 'nuextract' | 'combined';

// Passport data schema (for runtime validation)
export const PassportDataSchema = z.object({
  documentType: z.string().nullable().optional(),
  issuingCountry: z.string().nullable().optional(),
  surname: z.string(),
  givenNames: z.string(),
  documentNumber: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .nullable()
    .optional(),
  sex: z.enum(['M', 'F', 'X']).nullable().optional(),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .nullable()
    .optional(),
});

export type PassportData = z.infer<typeof PassportDataSchema>;

// Passport data with extraction metadata (for API responses)
export interface PassportDataWithMetadata extends PassportData {
  readonly extractionMethod: ExtractionMethod;
  readonly confidence: number;
}

// G-28 form data schema (for runtime validation)
export const G28DataSchema = z.object({
  attorneyName: z.string().nullable().optional(),
  firmName: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  clientName: z.string().nullable().optional(),
  alienNumber: z.string().nullable().optional(),
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

// Upload status
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// Extraction method (matches backend)
export type ExtractionMethod = 'mrz' | 'nuextract' | 'combined';

// API response types (aligned with backend ExtractApiResponse)
export interface ExtractResponse {
  readonly success: boolean;
  readonly data?: ExtractedData;
  readonly error?: ApiError;
  readonly warnings?: readonly string[];
  readonly warnings?: string[];
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

/**
 * Format full name from passport data
 */
// Passport data (aligned with backend PassportDataSchema)
export interface PassportData {
  readonly documentType?: string | null;
  readonly issuingCountry?: string | null;
  readonly surname: string;
  readonly givenNames: string;
  readonly documentNumber?: string | null;
  readonly nationality?: string | null;
  readonly dateOfBirth?: string | null; // YYYY-MM-DD format
  readonly sex?: 'M' | 'F' | 'X' | null;
  readonly expirationDate?: string | null; // YYYY-MM-DD format
}

// Passport data with extraction metadata (for API responses)
export interface PassportDataWithMetadata extends PassportData {
  readonly extractionMethod: ExtractionMethod;
  readonly confidence: number;
}

// G-28 form data (aligned with backend G28DataSchema)
export interface G28Data {
  readonly attorneyName?: string | null;
  readonly firmName?: string | null;
  readonly street?: string | null;
  readonly city?: string | null;
  readonly state?: string | null;
  readonly zipCode?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly clientName?: string | null;
  readonly alienNumber?: string | null;
}

// App state for files
export interface AppState {
  readonly passportFile: File | null;
  readonly g28File: File | null;
  readonly uploadStatus: UploadStatus;
  readonly errorMessage: string | null;
  readonly successMessage: string | null;
}

export interface AppStateContextValue extends AppState {
  setPassportFile: (file: File | null) => void;
  setG28File: (file: File | null) => void;
  setUploadStatus: (status: UploadStatus) => void;
  setErrorMessage: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  resetState: () => void;
}

// Helper to format full name from passport data
export function formatFullName(passport: PassportData): string {
  return `${passport.givenNames} ${passport.surname}`.trim();
}
