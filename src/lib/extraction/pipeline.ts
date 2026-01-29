import {
  type PassportData,
  type G28Data,
  type ExtractionResult,
  type ExtractionError,
  PassportDataSchema,
  G28DataSchema,
} from '@/types';
import { bufferToBase64 } from './nuextract-client';
import {
  extractG28WithGemini,
  extractPassportWithGemini,
  isGeminiVisionEnabled,
  GeminiVisionError,
  type SupportedMediaType,
} from './gemini-vision-client';

/**
 * Extraction pipeline that orchestrates various extraction services
 *
 * For passports:
 * - Uses Gemini Vision API exclusively
 * - Requires GOOGLE_GENERATIVE_AI_API_KEY environment variable
 *
 * For G-28 forms:
 * - Uses Gemini Vision API exclusively
 * - Requires GOOGLE_GENERATIVE_AI_API_KEY environment variable
 *
 * Errors are explicit - no silent failures.
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
 * Extract passport data from an image or PDF buffer
 *
 * Uses Gemini Vision API exclusively for extraction.
 *
 * @param fileBuffer - Raw file bytes (image or PDF)
 * @param _ocrText - Deprecated: kept for API compatibility
 * @param mimeType - MIME type of the file (required for Gemini Vision)
 */
export async function extractPassportData(
  fileBuffer: Buffer,
  _ocrText?: string,
  mimeType?: string
): Promise<ExtractionResult<PassportData>> {
  const errors: ExtractionError[] = [];
  const warnings: string[] = [];

  // Step 1: Validate Gemini Vision is enabled
  if (!isGeminiVisionEnabled()) {
    console.error('[Passport Extraction] Gemini Vision is not enabled - GOOGLE_GENERATIVE_AI_API_KEY missing');
    errors.push({
      type: 'API_ERROR',
      message: 'Gemini Vision is not enabled. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable.',
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

  // Step 2: Validate mime type
  if (!mimeType || (!isPdfMimeType(mimeType) && !isImageMimeType(mimeType))) {
    console.error(`[Passport Extraction] Unsupported file type: ${mimeType}`);
    errors.push({
      type: 'INVALID_FILE_TYPE',
      message: `Unsupported file type: ${mimeType}. Accepted: PDF, PNG, JPEG, GIF, WEBP`,
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

  // Step 3: Convert buffer to base64 and determine media type
  const fileBase64 = bufferToBase64(fileBuffer);
  let mediaType: SupportedMediaType;

  if (isPdfMimeType(mimeType)) {
    mediaType = 'application/pdf';
  } else if (mimeType === 'image/jpeg') {
    mediaType = 'image/jpeg';
  } else if (mimeType === 'image/gif') {
    mediaType = 'image/gif';
  } else if (mimeType === 'image/webp') {
    mediaType = 'image/webp';
  } else {
    mediaType = 'image/png';
  }

  // Step 4: Call Gemini Vision API
  try {
    const extractedData = await extractPassportWithGemini(fileBase64, mediaType);
    console.log('[Passport Extraction] Gemini response:', JSON.stringify(extractedData, null, 2));

    // Step 5: Normalize the extracted data
    const normalizedData = {
      documentType: extractedData.documentType ?? '',
      issuingCountry: extractedData.issuingCountry ?? '',
      surname: extractedData.surname ?? '',
      givenNames: extractedData.givenNames ?? '',
      documentNumber: extractedData.documentNumber ?? '',
      nationality: extractedData.nationality ?? '',
      dateOfBirth: normalizeDate(extractedData.dateOfBirth),
      sex: normalizeSex(extractedData.sex),
      expirationDate: normalizeDate(extractedData.expirationDate),
    };

    // Step 6: Validate with Zod
    const validation = PassportDataSchema.safeParse(normalizedData);

    if (validation.success) {
      return {
        success: true,
        data: validation.data,
        method: 'combined',
        confidence: 0.95,
        errors: [],
        warnings,
      };
    }

    // Partial success - return data even if validation fails
    warnings.push('Gemini Vision extracted data but validation failed');
    return {
      success: false,
      data: normalizedData as PassportData,
      method: 'combined',
      confidence: 0.7,
      errors: [{
        type: 'VALIDATION_FAILED',
        message: 'Extracted passport data failed validation',
        fields: validation.error.issues.map((i) => i.path.join('.')),
      }],
      warnings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Passport Extraction] Gemini Vision failed: ${errorMessage}`);

    if (error instanceof GeminiVisionError) {
      errors.push({
        type: 'API_ERROR',
        message: `Gemini Vision extraction failed: ${error.message}`,
        statusCode: error.statusCode,
      });
    } else {
      errors.push({
        type: 'API_ERROR',
        message: `Gemini Vision extraction failed: ${errorMessage}`,
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
}

/**
 * Check if a mime type is a PDF
 */
function isPdfMimeType(mimeType: string | undefined): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Check if a mime type is a supported image
 */
function isImageMimeType(
  mimeType: string | undefined
): mimeType is 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' {
  return ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(mimeType ?? '');
}

/**
 * Extract G-28 form data from a file buffer
 *
 * Uses Gemini Vision API directly with native PDF support.
 * PDFs are sent directly to Claude without conversion.
 *
 * NOTE: Gemini Vision is the only extraction method for G-28 forms.
 * Errors will be explicit - no silent failures.
 *
 * @param fileBuffer - Raw file bytes (PDF or image)
 * @param mimeType - MIME type of the file (required for Gemini Vision)
 */
export async function extractG28Data(
  fileBuffer: Buffer,
  mimeType?: string
): Promise<ExtractionResult<G28Data>> {
  const errors: ExtractionError[] = [];
  const warnings: string[] = [];

  // Step 1: Validate Gemini Vision is enabled
  if (!isGeminiVisionEnabled()) {
    console.error('[G28 Extraction] Gemini Vision is not enabled - GOOGLE_GENERATIVE_AI_API_KEY missing');
    errors.push({
      type: 'API_ERROR',
      message: 'Gemini Vision is not enabled. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable.',
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

  // Step 2: Validate mime type
  if (!mimeType || (!isPdfMimeType(mimeType) && !isImageMimeType(mimeType))) {
    console.error(`[G28 Extraction] Unsupported file type: ${mimeType}`);
    errors.push({
      type: 'INVALID_FILE_TYPE',
      message: `Unsupported file type: ${mimeType}. Accepted: PDF, PNG, JPEG, GIF, WEBP`,
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

  // Step 3: Convert buffer to base64 and determine media type
  const fileBase64 = bufferToBase64(fileBuffer);
  let mediaType: SupportedMediaType;

  if (isPdfMimeType(mimeType)) {
    mediaType = 'application/pdf';
    console.log('[G28 Extraction] Sending PDF directly to Gemini Vision (native PDF support)...');
  } else if (mimeType === 'image/jpeg') {
    mediaType = 'image/jpeg';
    console.log('[G28 Extraction] Sending JPEG image to Gemini Vision...');
  } else if (mimeType === 'image/gif') {
    mediaType = 'image/gif';
    console.log('[G28 Extraction] Sending GIF image to Gemini Vision...');
  } else if (mimeType === 'image/webp') {
    mediaType = 'image/webp';
    console.log('[G28 Extraction] Sending WebP image to Gemini Vision...');
  } else {
    mediaType = 'image/png';
    console.log('[G28 Extraction] Sending PNG image to Gemini Vision...');
  }

  // Step 4: Call Gemini Vision API
  try {
    const extractedData = await extractG28WithGemini(fileBase64, mediaType);
    console.log('[G28 Extraction] Gemini response:', JSON.stringify(extractedData, null, 2));

    // Step 5: Validate with Zod
    const validation = G28DataSchema.safeParse(extractedData);

    if (validation.success) {
      return {
        success: true,
        data: validation.data,
        method: 'combined',
        confidence: 0.95,
        errors: [],
        warnings,
      };
    }

    // Partial success - return data even if validation fails
    warnings.push('Gemini Vision extracted data but validation failed');
    return {
      success: false,
      data: extractedData as G28Data,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[G28 Extraction] Gemini Vision failed: ${errorMessage}`);

    if (error instanceof GeminiVisionError) {
      errors.push({
        type: 'API_ERROR',
        message: `Gemini Vision extraction failed: ${error.message}`,
        statusCode: error.statusCode,
      });
    } else {
      errors.push({
        type: 'API_ERROR',
        message: `Gemini Vision extraction failed: ${errorMessage}`,
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
}
