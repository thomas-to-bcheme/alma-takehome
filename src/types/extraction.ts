import { z } from 'zod';

/**
 * Passport data extracted from MRZ or NuExtract API
 */
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

/**
 * G-28 form data extracted from NuExtract API
 */
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

/**
 * Extraction method used to obtain data
 */
export type ExtractionMethod = 'mrz' | 'nuextract' | 'combined';

/**
 * Result of the extraction pipeline
 */
export interface ExtractionResult<T> {
  success: boolean;
  data: T | null;
  method: ExtractionMethod;
  confidence: number;
  errors: ExtractionError[];
  warnings: string[];
}

/**
 * Extraction error types
 */
export type ExtractionError =
  | { type: 'MRZ_NOT_FOUND'; message: string }
  | { type: 'MRZ_INVALID_CHECK'; message: string; field: string }
  | { type: 'API_ERROR'; message: string; statusCode?: number }
  | { type: 'API_TIMEOUT'; message: string }
  | { type: 'VALIDATION_FAILED'; message: string; fields: string[] }
  | { type: 'INVALID_FILE_TYPE'; message: string }
  | { type: 'FILE_TOO_LARGE'; message: string };

/**
 * Passport data with extraction metadata for API responses
 */
export interface PassportDataWithMetadata extends PassportData {
  extractionMethod: ExtractionMethod;
  confidence: number;
}

/**
 * API request/response types
 */
export interface ExtractApiResponse {
  success: boolean;
  data?: {
    passport?: PassportDataWithMetadata;
    g28?: G28Data;
  };
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: string;
  };
  warnings?: string[];
}

/**
 * File validation result
 */
export interface FileValidation {
  valid: boolean;
  error?: ExtractionError;
}

/**
 * Accepted file types
 */
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
