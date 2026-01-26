import type { AcceptedMimeType } from '@/types';

// Form revision
export const FORM_REVISION = 'Rev. 04/2025';

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
  MISSING_FILE: 'MISSING_FILE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  SERVER_ERROR: 'SERVER_ERROR',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Error messages
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_FILE_TYPE]: `Invalid file type. Accepted formats: PDF, PNG, JPEG`,
  [ERROR_CODES.FILE_TOO_LARGE]: `File size exceeds ${MAX_SIZE_MB}MB limit`,
  [ERROR_CODES.MISSING_PASSPORT]: 'Passport document is required',
  [ERROR_CODES.MISSING_FILE]: 'Required file is missing',
  [ERROR_CODES.UPLOAD_FAILED]: 'Upload failed. Please try again',
  [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later',
  [ERROR_CODES.EXTRACTION_FAILED]: 'Could not extract data from document',
  [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  UPLOAD_COMPLETE: 'Documents uploaded successfully',
  EXTRACTION_COMPLETE: 'Data extraction complete',
} as const;

// NuExtract configuration defaults
export const NUEXTRACT_DEFAULTS = {
  TIMEOUT_MS: 30000,
} as const;

// PassportEye configuration defaults
export const PASSPORTEYE_DEFAULTS = {
  TIMEOUT_MS: 30000,
  ENABLED: true,
} as const;

// US States for address dropdowns
export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;
