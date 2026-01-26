/**
 * Client for the PassportEye microservice
 *
 * Communicates with the Python microservice to extract MRZ data from passport images
 * using PassportEye + Tesseract OCR.
 */

import type { PassportData } from '@/types';
import { getExtractionConfig } from '@/lib/config/extraction';

/**
 * Result from PassportEye extraction
 */
export interface PassportEyeResult {
  readonly success: boolean;
  readonly data: PassportData | null;
  readonly confidence: number;
  readonly error?: string;
}

/**
 * Error thrown when PassportEye extraction fails
 */
export class PassportEyeError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'API_ERROR' | 'DISABLED' | 'NETWORK_ERROR',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'PassportEyeError';
  }
}

/**
 * Check if PassportEye service is enabled
 */
export function isPassportEyeEnabled(): boolean {
  const config = getExtractionConfig();
  return config.passporteye?.enabled ?? false;
}

/**
 * Extract passport data using the PassportEye microservice
 *
 * @param imageBuffer - Raw image bytes
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns Extraction result with success status, data, and confidence
 * @throws PassportEyeError if the service is disabled, times out, or returns an error
 */
export async function extractWithPassportEye(
  imageBuffer: Buffer,
  mimeType: string
): Promise<PassportEyeResult> {
  const config = getExtractionConfig();

  // Check if PassportEye is enabled
  if (!config.passporteye?.enabled) {
    throw new PassportEyeError(
      'PassportEye service is disabled',
      'DISABLED'
    );
  }

  const { apiUrl, timeoutMs } = config.passporteye;

  // Create form data with the image
  // Convert Buffer to Uint8Array for Blob compatibility
  const formData = new FormData();
  const uint8Array = new Uint8Array(imageBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });
  const filename = `passport.${mimeType.split('/')[1] || 'jpg'}`;
  formData.append('file', blob, filename);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new PassportEyeError(
        `PassportEye API error: ${errorText}`,
        'API_ERROR',
        response.status
      );
    }

    const result = await response.json() as PassportEyeResult;

    return {
      success: result.success,
      data: result.data,
      confidence: result.confidence,
      error: result.error,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof PassportEyeError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new PassportEyeError(
        `PassportEye request timed out after ${timeoutMs}ms`,
        'TIMEOUT'
      );
    }

    throw new PassportEyeError(
      error instanceof Error ? error.message : 'Network error connecting to PassportEye',
      'NETWORK_ERROR'
    );
  }
}
