import type { AcceptedMimeType } from '@/types';

// File size limits
export const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_SIZE_MB = 10;

// Accepted MIME types
export const ACCEPTED_MIME_TYPES: readonly AcceptedMimeType[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

// File extensions for input accept attribute
export const ACCEPTED_EXTENSIONS = '.pdf,.png,.jpg,.jpeg';
export const ACCEPTED_EXTENSIONS_PDF_ONLY = '.pdf';

// Error codes
export const ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  MISSING_PASSPORT: 'MISSING_PASSPORT',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Error messages
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_FILE_TYPE]: `Invalid file type. Accepted formats: PDF, PNG, JPEG`,
  [ERROR_CODES.FILE_TOO_LARGE]: `File size exceeds ${MAX_SIZE_MB}MB limit`,
  [ERROR_CODES.MISSING_PASSPORT]: 'Passport document is required',
  [ERROR_CODES.UPLOAD_FAILED]: 'Upload failed. Please try again',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  UPLOAD_COMPLETE: 'Documents uploaded successfully',
  EXTRACTION_COMPLETE: 'Data extraction complete',
} as const;
