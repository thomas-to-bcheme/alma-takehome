import {
  type PassportData,
  type G28Data,
  type ExtractionResult,
  type ExtractionError,
  PassportDataSchema,
  G28DataSchema,
} from '@/types';
import { extractWithNuExtract, bufferToBase64, NuExtractError } from './nuextract-client';
import {
  extractWithPassportEye,
  isPassportEyeEnabled,
  PassportEyeError,
} from './passporteye-client';
import { extractFromMRZ } from './mrz/parser';
import { PASSPORT_TEMPLATE, G28_TEMPLATE } from './templates';

/**
 * Extraction pipeline that orchestrates PassportEye, MRZ parsing, and NuExtract API fallback
 *
 * For passports:
 * 1. Attempt PassportEye extraction (highest accuracy with Tesseract OCR)
 * 2. If PassportEye fails, try MRZ parsing
 * 3. If MRZ fails, fall back to NuExtract API
 *
 * For G-28 forms:
 * 1. Use NuExtract API directly (no MRZ available)
 */

/**
 * Normalize a date string to YYYY-MM-DD format
 * Handles various input formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.
 */
function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;

  // Already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try DD/MM/YYYY or MM/DD/YYYY format
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    // Assume DD/MM/YYYY for international dates
    const day = first.padStart(2, '0');
    const month = second.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try DD.MM.YYYY format
  const dotMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const [, day, month, year] = dotMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Return original if no match (will fail validation)
  return dateStr;
}

/**
 * Normalize sex field to M/F/X
 */
function normalizeSex(sex: string | null | undefined): 'M' | 'F' | 'X' | null {
  if (!sex) return null;

  const normalized = sex.toUpperCase().trim();

  if (normalized === 'M' || normalized === 'MALE') return 'M';
  if (normalized === 'F' || normalized === 'FEMALE') return 'F';
  if (normalized === 'X' || normalized === 'OTHER') return 'X';

  return null;
}

/**
 * Extract passport data from an image buffer
 *
 * Uses PassportEye first, then MRZ parsing, then falls back to NuExtract API
 *
 * @param imageBuffer - Raw image bytes
 * @param ocrText - Optional pre-extracted OCR text for MRZ parsing
 * @param mimeType - MIME type of the image (required for PassportEye)
 */
export async function extractPassportData(
  imageBuffer: Buffer,
  ocrText?: string,
  mimeType?: string
): Promise<ExtractionResult<PassportData>> {
  const errors: ExtractionError[] = [];
  const warnings: string[] = [];

  // Step 1: Try PassportEye if enabled and mimeType is provided
  if (mimeType && isPassportEyeEnabled()) {
    try {
      const passportEyeResult = await extractWithPassportEye(imageBuffer, mimeType);

      if (passportEyeResult.success && passportEyeResult.data) {
        // Validate with Zod
        const validation = PassportDataSchema.safeParse(passportEyeResult.data);

        if (validation.success) {
          return {
            success: true,
            data: validation.data,
            method: 'passporteye',
            confidence: passportEyeResult.confidence,
            errors: [],
            warnings: [],
          };
        }

        warnings.push('PassportEye extracted data but validation failed, trying fallbacks');
      } else {
        warnings.push(
          `PassportEye extraction failed: ${passportEyeResult.error ?? 'Unknown error'}, trying fallbacks`
        );
      }
    } catch (error) {
      if (error instanceof PassportEyeError) {
        if (error.code !== 'DISABLED') {
          warnings.push(`PassportEye error: ${error.message}, trying fallbacks`);
        }
      } else {
        warnings.push('PassportEye unexpected error, trying fallbacks');
      }
    }
  }

  // Step 2: Try MRZ parsing if OCR text is available
  if (ocrText) {
    const mrzResult = extractFromMRZ(ocrText);

    if (mrzResult.success && mrzResult.data) {
      // Validate with Zod
      const validation = PassportDataSchema.safeParse(mrzResult.data);

      if (validation.success) {
        return {
          success: true,
          data: validation.data,
          method: 'mrz',
          confidence: mrzResult.confidence,
          errors: [],
          warnings: mrzResult.errors.length > 0 ? ['MRZ had minor parsing issues'] : [],
        };
      }

      warnings.push('MRZ parsed but validation failed, falling back to NuExtract');
    } else {
      // MRZ not found or failed - not an error, just a fallback trigger
      warnings.push('MRZ not detected, using NuExtract API');
    }
  }

  // Step 3: Fall back to NuExtract API
  try {
    const base64 = bufferToBase64(imageBuffer);
    const rawData = await extractWithNuExtract(base64, PASSPORT_TEMPLATE);

    // Normalize the extracted data
    const normalizedData = {
      ...rawData,
      dateOfBirth: normalizeDate(rawData.dateOfBirth),
      expirationDate: normalizeDate(rawData.expirationDate),
      sex: normalizeSex(rawData.sex),
    };

    // Validate with Zod
    const validation = PassportDataSchema.safeParse(normalizedData);

    if (!validation.success) {
      const failedFields = validation.error.issues.map((i) => i.path.join('.'));
      errors.push({
        type: 'VALIDATION_FAILED',
        message: 'Extracted data failed validation',
        fields: failedFields,
      });

      return {
        success: false,
        data: normalizedData as PassportData,
        method: 'nuextract',
        confidence: 0.5,
        errors,
        warnings,
      };
    }

    return {
      success: true,
      data: validation.data,
      method: ocrText ? 'combined' : 'nuextract',
      confidence: 0.9,
      errors: [],
      warnings,
    };
  } catch (error) {
    if (error instanceof NuExtractError) {
      if (error.code === 'TIMEOUT') {
        errors.push({
          type: 'API_TIMEOUT',
          message: error.message,
        });
      } else {
        errors.push({
          type: 'API_ERROR',
          message: error.message,
          statusCode: error.statusCode,
        });
      }
    } else {
      errors.push({
        type: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown extraction error',
      });
    }

    return {
      success: false,
      data: null,
      method: 'nuextract',
      confidence: 0,
      errors,
      warnings,
    };
  }
}

/**
 * Extract G-28 form data from an image buffer
 *
 * Uses NuExtract API directly (G-28 forms don't have MRZ)
 */
export async function extractG28Data(
  imageBuffer: Buffer
): Promise<ExtractionResult<G28Data>> {
  const errors: ExtractionError[] = [];
  const warnings: string[] = [];

  try {
    const base64 = bufferToBase64(imageBuffer);
    const rawData = await extractWithNuExtract(base64, G28_TEMPLATE);

    // Validate with Zod
    const validation = G28DataSchema.safeParse(rawData);

    if (!validation.success) {
      const failedFields = validation.error.issues.map((i) => i.path.join('.'));
      errors.push({
        type: 'VALIDATION_FAILED',
        message: 'Extracted G-28 data failed validation',
        fields: failedFields,
      });

      // Return partial data even if validation fails
      return {
        success: false,
        data: rawData as G28Data,
        method: 'nuextract',
        confidence: 0.5,
        errors,
        warnings,
      };
    }

    return {
      success: true,
      data: validation.data,
      method: 'nuextract',
      confidence: 0.9,
      errors: [],
      warnings,
    };
  } catch (error) {
    if (error instanceof NuExtractError) {
      if (error.code === 'TIMEOUT') {
        errors.push({
          type: 'API_TIMEOUT',
          message: error.message,
        });
      } else {
        errors.push({
          type: 'API_ERROR',
          message: error.message,
          statusCode: error.statusCode,
        });
      }
    } else {
      errors.push({
        type: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown extraction error',
      });
    }

    return {
      success: false,
      data: null,
      method: 'nuextract',
      confidence: 0,
      errors,
      warnings,
    };
  }
}
