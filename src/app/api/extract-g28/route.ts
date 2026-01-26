import { NextRequest, NextResponse } from 'next/server';
import {
  ACCEPTED_MIME_TYPES,
  MAX_SIZE_BYTES,
  MAX_SIZE_MB,
} from '@/lib/constants';
import type { ExtractResponse, AcceptedMimeType } from '@/types';
import { extractG28Data } from '@/lib/extraction/pipeline';

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
 * POST /api/extract-g28
 *
 * Extract data from uploaded G-28 document only.
 * This endpoint allows G-28 extraction without requiring a passport file.
 *
 * Request: multipart/form-data
 * - g28: File (required) - G-28 form image/PDF
 *
 * Response: ExtractResponse with g28 data only
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  try {
    const formData = await request.formData();
    const g28File = formData.get('g28') as File | null;

    // Validate G-28 is provided (required)
    if (!g28File || g28File.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'G-28 file is required',
            field: 'g28',
          },
        },
        { status: 400 }
      );
    }

    // Validate G-28 file type and size
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

    // Extract data from G-28
    const g28Buffer = Buffer.from(await g28File.arrayBuffer());
    const g28Result = await extractG28Data(g28Buffer, g28File.type);

    // Collect warnings
    const warnings: string[] = [...g28Result.warnings];

    // Check for extraction failures
    if (!g28Result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: 'Could not extract data from G-28 form',
            details: g28Result.errors.map((e) => e.message).join('; '),
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
        g28: g28Result.data ?? undefined,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    // Log error without PII
    console.error('Extract G-28 API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during G-28 extraction',
        },
      },
      { status: 500 }
    );
  }
}
