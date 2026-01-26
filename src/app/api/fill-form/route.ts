import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { FormFillResult } from '@/types';
import {
  fillFormWithAutomation,
  isFormAutomationEnabled,
  FormFillError,
} from '@/lib/automation/form-fill-client';
import { formA28Schema } from '@/lib/validation/formA28Schema';

/**
 * Request body schema for fill-form endpoint
 */
const FillFormRequestSchema = z.object({
  formData: formA28Schema,
});

/**
 * Response type for fill-form endpoint
 */
interface FillFormResponse {
  readonly success: boolean;
  readonly data?: FormFillResult;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: string;
  };
}

/**
 * POST /api/fill-form
 *
 * Fill the target form with provided form data using browser automation.
 *
 * Request: JSON
 * - formData: FormA28Data (required)
 *
 * Response: FillFormResponse
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<FillFormResponse>> {
  try {
    // Check if automation is enabled
    if (!isFormAutomationEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_DISABLED',
            message: 'Form automation service is not enabled',
            details:
              'Set FORM_AUTOMATION_API_URL and FORM_AUTOMATION_ENABLED=true in environment',
          },
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const parseResult = FillFormRequestSchema.safeParse(body);
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

    const { formData } = parseResult.data;

    // Call form automation service
    const result = await fillFormWithAutomation(formData);

    // Return result
    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    // Handle specific form fill errors
    if (error instanceof FormFillError) {
      const statusCode =
        error.code === 'DISABLED'
          ? 503
          : error.code === 'TIMEOUT'
            ? 504
            : error.statusCode ?? 500;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: statusCode }
      );
    }

    // Log error without PII
    console.error('Fill-form API error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during form fill',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fill-form
 *
 * Health check for form automation service
 */
export async function GET(): Promise<NextResponse> {
  const enabled = isFormAutomationEnabled();

  return NextResponse.json({
    service: 'fill-form',
    enabled,
    message: enabled
      ? 'Form automation service is available'
      : 'Form automation service is disabled',
  });
}
