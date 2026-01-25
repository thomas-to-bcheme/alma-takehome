// File validation types
export type AcceptedMimeType = 'application/pdf' | 'image/png' | 'image/jpeg';

export interface FileValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

// Document types
export type DocumentType = 'passport' | 'g28';

export interface DocumentFile {
  readonly file: File;
  readonly type: DocumentType;
  readonly previewUrl?: string;
}

// Upload status
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// Extraction method (matches backend)
export type ExtractionMethod = 'mrz' | 'nuextract' | 'combined';

// API response types (aligned with backend ExtractApiResponse)
export interface ExtractResponse {
  readonly success: boolean;
  readonly data?: ExtractedData;
  readonly error?: ApiError;
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
