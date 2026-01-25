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

// API response types
export interface ExtractResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data?: ExtractedData;
  readonly error?: string;
}

export interface ExtractedData {
  readonly passport?: PassportData;
  readonly g28?: G28Data;
}

export interface PassportData {
  readonly fullName?: string;
  readonly dateOfBirth?: string;
  readonly passportNumber?: string;
  readonly nationality?: string;
  readonly expirationDate?: string;
}

export interface G28Data {
  readonly attorneyName?: string;
  readonly firmName?: string;
  readonly clientName?: string;
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
