/**
 * Client for the G-28 Claude Vision extraction microservice
 *
 * Communicates with the Python microservice to extract G-28 form data
 * using Claude Vision API.
 */

import { getExtractionConfig } from '@/lib/config/extraction';

/**
 * Address structure from G-28 extraction
 */
export interface G28ClaudeAddress {
  readonly street: string;
  readonly suite: string;
  readonly city: string;
  readonly state: string;
  readonly zip_code: string;
}

/**
 * Attorney information from G-28 extraction
 */
export interface G28ClaudeAttorney {
  readonly family_name: string;
  readonly given_name: string;
  readonly middle_name: string;
  readonly firm_name: string;
  readonly address: G28ClaudeAddress;
  readonly phone: string;
  readonly email: string;
}

/**
 * Eligibility information from G-28 extraction
 */
export interface G28ClaudeEligibility {
  readonly is_attorney: boolean;
  readonly bar_number: string;
  readonly is_accredited_rep: boolean;
}

/**
 * Client information from G-28 extraction
 */
export interface G28ClaudeClient {
  readonly family_name: string;
  readonly given_name: string;
  readonly middle_name: string;
  readonly phone: string;
  readonly email: string;
  readonly alien_number: string;
}

/**
 * Complete G-28 extracted data structure
 */
export interface G28ClaudeData {
  readonly attorney: G28ClaudeAttorney;
  readonly eligibility: G28ClaudeEligibility;
  readonly client: G28ClaudeClient;
}

/**
 * Result from G-28 Claude extraction
 */
export interface G28ClaudeResult {
  readonly success: boolean;
  readonly data: G28ClaudeData | null;
  readonly confidence: number;
  readonly error?: string;
}

/**
 * Error thrown when G-28 Claude extraction fails
 */
export class G28ClaudeError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'API_ERROR' | 'DISABLED' | 'NETWORK_ERROR',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'G28ClaudeError';
  }
}

/**
 * Check if G-28 Claude service is enabled
 */
export function isG28ClaudeEnabled(): boolean {
  const config = getExtractionConfig();
  return config.g28Claude?.enabled ?? false;
}

/**
 * Extract G-28 data using the Claude Vision microservice
 *
 * @param fileBuffer - Raw file bytes (PDF or image)
 * @param mimeType - MIME type of the file (e.g., 'application/pdf', 'image/jpeg')
 * @returns Extraction result with success status, data, and confidence
 * @throws G28ClaudeError if the service is disabled, times out, or returns an error
 */
export async function extractG28WithClaude(
  fileBuffer: Buffer,
  mimeType: string
): Promise<G28ClaudeResult> {
  const config = getExtractionConfig();

  // Check if G-28 Claude is enabled
  if (!config.g28Claude?.enabled) {
    throw new G28ClaudeError('G-28 Claude service is disabled', 'DISABLED');
  }

  const { apiUrl, timeoutMs } = config.g28Claude;

  // Create form data with the file
  const formData = new FormData();
  const uint8Array = new Uint8Array(fileBuffer);
  const blob = new Blob([uint8Array], { type: mimeType });

  // Determine filename based on mime type
  let filename = 'g28';
  if (mimeType === 'application/pdf') {
    filename = 'g28.pdf';
  } else if (mimeType === 'image/png') {
    filename = 'g28.png';
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    filename = 'g28.jpg';
  }

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
      throw new G28ClaudeError(
        `G-28 Claude API error: ${errorText}`,
        'API_ERROR',
        response.status
      );
    }

    const result = (await response.json()) as G28ClaudeResult;

    return {
      success: result.success,
      data: result.data,
      confidence: result.confidence,
      error: result.error,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof G28ClaudeError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new G28ClaudeError(
        `G-28 Claude request timed out after ${timeoutMs}ms`,
        'TIMEOUT'
      );
    }

    throw new G28ClaudeError(
      error instanceof Error ? error.message : 'Network error connecting to G-28 Claude service',
      'NETWORK_ERROR'
    );
  }
}
