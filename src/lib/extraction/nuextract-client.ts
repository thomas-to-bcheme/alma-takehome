import { getExtractionConfig } from '@/lib/config/extraction';
import type { PassportTemplate, G28Template } from './templates';

/**
 * NuExtract API client for document data extraction
 *
 * Sends images/PDFs to the NuExtract API with a JSON template
 * specifying what fields to extract.
 */

/**
 * NuExtract API request payload
 */
interface NuExtractRequest {
  readonly text?: string;
  readonly image?: string; // base64 encoded
  readonly template: Readonly<Record<string, string>>;
}

/**
 * NuExtract API response
 */
interface NuExtractResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

/**
 * NuExtract client error
 */
export class NuExtractError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'NuExtractError';
  }
}

/**
 * Extract structured data from an image using NuExtract API
 *
 * @param imageBase64 - Base64 encoded image data (without data URI prefix)
 * @param template - JSON template defining fields to extract
 * @returns Extracted data matching the template structure
 */
export async function extractWithNuExtract<T extends PassportTemplate | G28Template>(
  imageBase64: string,
  template: T
): Promise<T> {
  const config = getExtractionConfig();

  const requestBody: NuExtractRequest = {
    image: imageBase64,
    template: template as Readonly<Record<string, string>>,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.nuextract.timeoutMs);

  try {
    const response = await fetch(config.nuextract.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.nuextract.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new NuExtractError(
        `NuExtract API error: ${errorText}`,
        response.status,
        'API_ERROR'
      );
    }

    const result: NuExtractResponse<T> = await response.json();

    if (!result.success || !result.data) {
      throw new NuExtractError(
        result.error?.message || 'Extraction failed with no data',
        undefined,
        result.error?.code || 'EXTRACTION_FAILED'
      );
    }

    return result.data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof NuExtractError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new NuExtractError(
          `NuExtract API timeout after ${config.nuextract.timeoutMs}ms`,
          undefined,
          'TIMEOUT'
        );
      }
      throw new NuExtractError(`NuExtract request failed: ${error.message}`);
    }

    throw new NuExtractError('Unknown error during NuExtract request');
  }
}

/**
 * Convert a file buffer to base64 string
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Extract base64 data from a data URI
 * e.g., "data:image/png;base64,ABC123..." -> "ABC123..."
 */
export function extractBase64FromDataUri(dataUri: string): string {
  const match = dataUri.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUri;
}
