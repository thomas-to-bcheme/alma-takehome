import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fillFormLocal, isLocalPlaywrightEnabled } from '@/lib/automation/local-playwright';
import { formA28Schema } from '@/lib/validation/formA28Schema';

/**
 * Request body schema for fill-form-local endpoint
 */
const FillFormLocalRequestSchema = z.object({
  formData: formA28Schema,
  options: z
    .object({
      headless: z.boolean().optional(),
      slowMo: z.number().optional(),
    })
    .optional(),
});

/**
 * Response type for fill-form-local endpoint
 */
interface FillFormLocalResponse {
  readonly success: boolean;
  readonly data?: {
    readonly screenshot?: string;
    readonly filledCount: number;
    readonly skippedCount: number;
    readonly failedCount: number;
    readonly failedFields?: Array<{
      readonly fieldName: string;
      readonly error: string;
    }>;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: string;
  };
}

/**
 * POST /api/fill-form-local
 *
 * Fill the target form using local Playwright automation.
 * This endpoint is for development/debugging purposes.
 *
 * Request: JSON
 * - formData: FormA28Data (required)
 * - options: { headless?: boolean, slowMo?: number } (optional)
 *
 * Response: FillFormLocalResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<FillFormLocalResponse>> {
  try {
    // Check if local Playwright is enabled
    if (!isLocalPlaywrightEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_DISABLED',
            message: 'Local Playwright automation is not enabled',
            details: 'Set LOCAL_PLAYWRIGHT_ENABLED=true in environment',
          },
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const parseResult = FillFormLocalRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors = parseResult.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { formData, options } = parseResult.data;

    // Call local Playwright fill
    const result = await fillFormLocal(formData, options);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILL_FAILED',
            message: result.error ?? 'Form fill failed',
          },
        },
        { status: 500 }
      );
    }

    // Return result
    return NextResponse.json({
      success: true,
      data: {
        screenshot: result.screenshot,
        filledCount: result.filledCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
        failedFields: result.failedFields,
      },
    });
  } catch (error) {
    // Log error without PII
    console.error('Fill-form-local API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during local form fill',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fill-form-local
 *
 * Health check for local Playwright automation
 */
export async function GET(): Promise<NextResponse> {
  const enabled = isLocalPlaywrightEnabled();

  return NextResponse.json({
    service: 'fill-form-local',
    enabled,
    status: 'healthy',
    message: enabled
      ? 'Local Playwright automation is available'
      : 'Local Playwright automation is disabled',
  });
}
