import { NextRequest, NextResponse } from 'next/server';
import {
  type ExtractApiResponse,
  type FileValidation,
  type ExtractionError,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE,
  type AcceptedMimeType,
} from '@/types/extraction';
import { extractPassportData, extractG28Data } from '@/lib/extraction/pipeline';

/**
 * POST /api/extract
 *
 * Extract data from uploaded passport and/or G-28 documents.
 *
 * Request: multipart/form-data
 * - passport: File (required) - Passport image/PDF
 * - g28: File (optional) - G-28 form image/PDF
 *
 * Response: ExtractApiResponse
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExtractApiResponse>> {
  try {
    const formData = await request.formData();

    const passportFile = formData.get('passport') as File | null;
    const g28File = formData.get('g28') as File | null;

    // Validate passport file (required)
    if (!passportFile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'Passport file is required',
            field: 'passport',
          },
        },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const passportValidation = validateFile(passportFile);
    if (!passportValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: errorToApiError(passportValidation.error!, 'passport'),
        },
        { status: 400 }
      );
    }

    if (g28File) {
      const g28Validation = validateFile(g28File);
      if (!g28Validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: errorToApiError(g28Validation.error!, 'g28'),
          },
          { status: 400 }
        );
      }
    }

    // Extract data from files
    const passportBuffer = Buffer.from(await passportFile.arrayBuffer());
    const passportResult = await extractPassportData(passportBuffer);

    let g28Result = null;
    if (g28File) {
      const g28Buffer = Buffer.from(await g28File.arrayBuffer());
      g28Result = await extractG28Data(g28Buffer);
    }

    // Collect warnings from all extractions
    const warnings: string[] = [
      ...passportResult.warnings,
      ...(g28Result?.warnings || []),
    ];

    // Check for extraction failures
    if (!passportResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: 'Could not extract data from passport',
            details: passportResult.errors.map((e) => e.message).join('; '),
          },
          warnings,
        },
        { status: 422 }
      );
    }

    // Build successful response
    const responseData: ExtractApiResponse = {
      success: true,
      data: {
        passport: passportResult.data
          ? {
              ...passportResult.data,
              extractionMethod: passportResult.method,
              confidence: passportResult.confidence,
            }
          : undefined,
        g28: g28Result?.data ?? undefined,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    // Log error without PII
    console.error('Extract API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during extraction',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Validate uploaded file type and size
 */
function validateFile(file: File): FileValidation {
  // Check MIME type
  if (!ACCEPTED_MIME_TYPES.includes(file.type as AcceptedMimeType)) {
    return {
      valid: false,
      error: {
        type: 'INVALID_FILE_TYPE',
        message: `File must be PDF, JPEG, or PNG. Received: ${file.type}`,
      },
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: {
        type: 'FILE_TOO_LARGE',
        message: `File exceeds 10MB limit. Size: ${sizeMB}MB`,
      },
    };
  }

  return { valid: true };
}

/**
 * Convert internal error to API error format
 */
function errorToApiError(
  error: ExtractionError,
  field: string
): ExtractApiResponse['error'] {
  return {
    code: error.type,
    message: error.message,
    field,
  };
}
