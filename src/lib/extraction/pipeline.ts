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
// Note: Docker Claude service imports removed - using direct Claude Vision API only
import {
  extractG28PageWithClaude,
  isClaudeVisionEnabled,
  ClaudeVisionError,
} from './claude-vision-client';
import {
  convertPdfToImages,
  isPdfMimeType,
  PdfConversionError,
} from './pdf-converter-client';
import { extractFromMRZ } from './mrz/parser';
import { PASSPORT_TEMPLATE } from './templates';

/**
 * Extraction pipeline that orchestrates various extraction services
 *
 * For passports:
 * 1. Attempt PassportEye extraction (highest accuracy with Tesseract OCR)
 * 2. If PassportEye fails, try MRZ parsing
 * 3. If MRZ fails, fall back to NuExtract API
 *
 * For G-28 forms:
 * - Uses Claude Vision API exclusively (no fallback)
 * - Requires ANTHROPIC_API_KEY environment variable
 * - Errors are explicit - no silent failures
 */

/**
 * Normalize a date string to YYYY-MM-DD format
 * Handles various input formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, etc.
 */
export function normalizeDate(dateStr: string | null | undefined): string | null {
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
export function normalizeSex(sex: string | null | undefined): 'M' | 'F' | 'X' | null {
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
 * Merge G-28 extraction results from multiple pages
 * Takes first non-empty value for each field
 */
function mergeG28Results(pageResults: Partial<G28Data>[]): Partial<G28Data> {
  const merged: Partial<G28Data> = {};

  const fields: (keyof G28Data)[] = [
    'attorneyName',
    'firmName',
    'street',
    'suite',
    'city',
    'state',
    'zipCode',
    'phone',
    'email',
    'clientName',
    'barNumber',
    'isAttorney',
    'isAccreditedRep',
    'clientPhone',
    'clientEmail',
  ];

  for (const field of fields) {
    for (const result of pageResults) {
      const value = result[field];
      // Take first non-empty value
      if (value !== undefined && value !== null && value !== '') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (merged as any)[field] = value;
        break;
      }
    }
  }

  return merged;
}

/**
 * Extract G-28 form data from a file buffer
 *
 * Uses Claude Vision API directly for page-by-page extraction.
 * For PDFs, converts to page images first via PDF conversion service.
 *
 * NOTE: Claude Vision is the only extraction method for G-28 forms.
 * NuExtract fallback has been removed - errors will be explicit.
 *
 * @param fileBuffer - Raw file bytes (PDF or image)
 * @param mimeType - MIME type of the file (required for Claude Vision)
 */
export async function extractG28Data(
  fileBuffer: Buffer,
  mimeType?: string
): Promise<ExtractionResult<G28Data>> {
  const errors: ExtractionError[] = [];
  const warnings: string[] = [];

  // Step 1: Convert PDF to page images (or use image directly)
  let pageImages: readonly string[];

  if (isPdfMimeType(mimeType)) {
    console.log('[G28 Extraction] PDF detected, converting to page images...');
    try {
      pageImages = await convertPdfToImages(fileBuffer);
      console.log(`[G28 Extraction] Converted PDF to ${pageImages.length} page images`);
    } catch (conversionError) {
      if (conversionError instanceof PdfConversionError) {
        console.error(`[G28 Extraction] PDF conversion failed: ${conversionError.message}`);
        errors.push({
          type: 'API_ERROR',
          message: `PDF conversion failed: ${conversionError.message}`,
        });
      } else {
        errors.push({
          type: 'API_ERROR',
          message: 'PDF conversion failed unexpectedly',
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
  } else {
    // For images, use the file directly
    pageImages = [bufferToBase64(fileBuffer)];
  }

  // Step 2: Try direct Claude Vision API (page-by-page)
  const claudeVisionEnabled = isClaudeVisionEnabled();
  console.log('[G28 Extraction] Claude Vision enabled:', claudeVisionEnabled);
  console.log('[G28 Extraction] ANTHROPIC_API_KEY present:', Boolean(process.env.ANTHROPIC_API_KEY));

  if (claudeVisionEnabled) {
    console.log('[G28 Extraction] Using direct Claude Vision API...');
    try {
      const pageResults: Partial<G28Data>[] = [];

      for (let i = 0; i < pageImages.length; i++) {
        console.log(`[G28 Extraction] Processing page ${i + 1}/${pageImages.length} with Claude Vision...`);
        const pageResult = await extractG28PageWithClaude(pageImages[i], 'image/png');
        pageResults.push(pageResult);
        console.log(`[G28 Extraction] Page ${i + 1} result:`, JSON.stringify(pageResult, null, 2));
      }

      // Merge results from all pages
      const mergedData = mergeG28Results(pageResults);
      console.log('[G28 Extraction] Merged result:', JSON.stringify(mergedData, null, 2));

      // Validate with Zod
      const validation = G28DataSchema.safeParse(mergedData);

      if (validation.success) {
        return {
          success: true,
          data: validation.data,
          method: 'combined', // 'combined' indicates Claude Vision method
          confidence: 0.95,
          errors: [],
          warnings,
        };
      }

      // Partial success - return data even if validation fails
      warnings.push('Claude Vision extracted data but validation failed');
      return {
        success: false,
        data: mergedData as G28Data,
        method: 'combined',
        confidence: 0.7,
        errors: [{
          type: 'VALIDATION_FAILED',
          message: 'Extracted G-28 data failed validation',
          fields: validation.error.issues.map((i) => i.path.join('.')),
        }],
        warnings,
      };
    } catch (error) {
      // Claude Vision is primary method - propagate errors instead of falling back
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[G28 Extraction] Claude Vision failed: ${errorMessage}`);

      if (error instanceof ClaudeVisionError) {
        errors.push({
          type: 'API_ERROR',
          message: `Claude Vision extraction failed: ${error.message}`,
          statusCode: error.statusCode,
        });
      } else {
        errors.push({
          type: 'API_ERROR',
          message: `Claude Vision extraction failed: ${errorMessage}`,
        });
      }

      return {
        success: false,
        data: null,
        method: 'combined',
        confidence: 0,
        errors,
        warnings,
      };
    }
  } else {
    // Claude Vision not enabled - this is a configuration error
    console.error('[G28 Extraction] Claude Vision is not enabled - ANTHROPIC_API_KEY missing');
    errors.push({
      type: 'API_ERROR',
      message: 'Claude Vision is not enabled. Set ANTHROPIC_API_KEY environment variable.',
    });

    return {
      success: false,
      data: null,
      method: 'combined',
      confidence: 0,
      errors,
      warnings,
    };
  }

  // NOTE: This point is unreachable - all code paths above return
  // Keeping this as a fallback safety net
  console.error('[G28 Extraction] Unexpected: reached unreachable code');
  errors.push({
    type: 'API_ERROR',
    message: 'Unexpected control flow error in G-28 extraction',
  });

  return {
    success: false,
    data: null,
    method: 'combined',
    confidence: 0,
    errors,
    warnings,
  };
}
