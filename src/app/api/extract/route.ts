import { NextRequest, NextResponse } from 'next/server';
import {
  ACCEPTED_MIME_TYPES,
  MAX_SIZE_BYTES,
  MAX_SIZE_MB,
} from '@/lib/constants';
import type { ExtractResponse, AcceptedMimeType } from '@/types';
import { extractPassportData, extractG28Data } from '@/lib/extraction/pipeline';

/**
 * Type guard for accepted MIME types
 */

function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return ACCEPTED_MIME_TYPES.includes(mimeType as AcceptedMimeType);
}

/**
 * File validation result
 */
interface FileValidation {
  readonly valid: boolean;
  readonly error?: {
    readonly type: string;
    readonly message: string;
  };
}

/**
 * Validate uploaded file type and size
 */
function validateFile(file: File): FileValidation {
  if (!isAcceptedMimeType(file.type)) {
    return {
      valid: false,
      error: {
        type: 'INVALID_FILE_TYPE',
        message: `File must be PDF, JPEG, or PNG. Received: ${file.type}`,
      },
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: {
        type: 'FILE_TOO_LARGE',
        message: `File exceeds ${MAX_SIZE_MB}MB limit. Size: ${sizeMB}MB`,
      },
    };
  }

  return { valid: true };
}

/**
 * POST /api/extract
 *
 * Extract data from uploaded passport and/or G-28 documents.
 *
 * Request: multipart/form-data
 * - passport: File (required) - Passport image/PDF
 * - g28: File (optional) - G-28 form image/PDF
 *
 * Response: ExtractResponse
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  try {
    const formData = await request.formData();

    const passportFile = formData.get('passport') as File | null;
    const g28File = formData.get('g28') as File | null;

    // Validate passport is provided (required)
    if (!passportFile || passportFile.size === 0) {
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

    // Validate passport file type and size
    const passportValidation = validateFile(passportFile);
    if (!passportValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: passportValidation.error!.type,
            message: passportValidation.error!.message,
            field: 'passport',
          },
        },
        { status: 400 }
      );
    }

    // Validate G-28 file if provided
    if (g28File && g28File.size > 0) {
      const g28Validation = validateFile(g28File);
      if (!g28Validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: g28Validation.error!.type,
              message: g28Validation.error!.message,
              field: 'g28',
            },
          },
          { status: 400 }
        );
      }
    }

    // Extract data from passport
    const passportBuffer = Buffer.from(await passportFile.arrayBuffer());
    const passportResult = await extractPassportData(
      passportBuffer,
      undefined, // No pre-extracted OCR text
      passportFile.type // Pass MIME type for PassportEye
    );

    // Extract data from G-28 if provided
    let g28Result = null;
    if (g28File && g28File.size > 0) {
      const g28Buffer = Buffer.from(await g28File.arrayBuffer());
      g28Result = await extractG28Data(g28Buffer);
    }

    // Collect warnings from all extractions
    const warnings: string[] = [
      ...passportResult.warnings,
      ...(g28Result?.warnings ?? []),
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
          warnings: warnings.length > 0 ? warnings : undefined,
        },
        { status: 422 }
      );
    }

    // Build successful response
    return NextResponse.json({
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
    });
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
