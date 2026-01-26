/**
 * Client for the Form Automation microservice
 *
 * Communicates with the Python microservice to fill the target form
 * using Playwright browser automation.
 */

import type { FormFillResult } from '@/types';
import type { FormA28Data } from '@/lib/validation/formA28Schema';
import { getExtractionConfig } from '@/lib/config/extraction';

/**
 * Error thrown when form fill operation fails
 */
export class FormFillError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'API_ERROR' | 'DISABLED' | 'NETWORK_ERROR',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'FormFillError';
  }
}

/**
 * Check if Form Automation service is enabled
 */
export function isFormAutomationEnabled(): boolean {
  const config = getExtractionConfig();
  return config.formAutomation?.enabled ?? false;
}

/**
 * Get the Form Automation service configuration
 */
export function getFormAutomationConfig():
  | { apiUrl: string; timeoutMs: number; enabled: boolean }
  | undefined {
  const config = getExtractionConfig();
  return config.formAutomation;
}

/**
 * Fill the target form with provided data using browser automation
 *
 * @param formData - The form data to fill (FormA28Data)
 * @returns Fill result with success status, filled/skipped/failed fields, and screenshot
 * @throws FormFillError if the service is disabled, times out, or returns an error
 */
export async function fillFormWithAutomation(
  formData: FormA28Data
): Promise<FormFillResult> {
  const config = getExtractionConfig();

  // Check if form automation is enabled
  if (!config.formAutomation?.enabled) {
    throw new FormFillError('Form automation service is disabled', 'DISABLED');
  }

  const { apiUrl, timeoutMs } = config.formAutomation;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new FormFillError(
        `Form automation API error: ${errorText}`,
        'API_ERROR',
        response.status
      );
    }

    const result = (await response.json()) as FormFillResult;

    return {
      success: result.success,
      filledFields: result.filledFields,
      skippedFields: result.skippedFields,
      failedFields: result.failedFields,
      screenshotBase64: result.screenshotBase64,
      durationMs: result.durationMs,
      error: result.error,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof FormFillError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new FormFillError(
        `Form automation request timed out after ${timeoutMs}ms`,
        'TIMEOUT'
      );
    }

    throw new FormFillError(
      error instanceof Error
        ? error.message
        : 'Network error connecting to form automation service',
      'NETWORK_ERROR'
    );
  }
}
