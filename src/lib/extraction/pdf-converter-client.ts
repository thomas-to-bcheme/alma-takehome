/**
 * Client for the PDF conversion service in the Docker container
 *
 * Converts PDF files to individual page images for extraction
 */

/**
 * PDF conversion result
 */
export interface PdfConversionResult {
  readonly success: boolean;
  readonly pages: readonly string[];
  readonly count: number;
}

/**
 * Error thrown when PDF conversion fails
 */
export class PdfConversionError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'API_ERROR' | 'NETWORK_ERROR',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'PdfConversionError';
  }
}

/**
 * Get the PDF conversion service URL from environment
 */
function getConversionServiceUrl(): string {
  // Use the same service as G-28 Claude extraction, but different endpoint
  const baseUrl = process.env.G28_CLAUDE_API_URL;
  if (!baseUrl) {
    throw new PdfConversionError(
      'G28_CLAUDE_API_URL environment variable not configured',
      'API_ERROR'
    );
  }
  // Replace /extract with /convert-pdf
  return baseUrl.replace('/extract', '/convert-pdf');
}

/**
 * Convert a PDF file to individual page images
 *
 * @param pdfBuffer - Raw PDF file bytes
 * @param timeoutMs - Request timeout in milliseconds (default: 60000)
 * @returns Array of base64-encoded page images
 * @throws PdfConversionError if conversion fails
 */
export async function convertPdfToImages(
  pdfBuffer: Buffer,
  timeoutMs: number = 60000
): Promise<readonly string[]> {
  const apiUrl = getConversionServiceUrl();

  // Create form data with the PDF file
  const formData = new FormData();
  const uint8Array = new Uint8Array(pdfBuffer);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  formData.append('file', blob, 'document.pdf');

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
      throw new PdfConversionError(
        `PDF conversion API error: ${errorText}`,
        'API_ERROR',
        response.status
      );
    }

    const result = (await response.json()) as PdfConversionResult;

    if (!result.success || !result.pages || result.pages.length === 0) {
      throw new PdfConversionError(
        'PDF conversion returned no pages',
        'API_ERROR'
      );
    }

    return result.pages;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof PdfConversionError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new PdfConversionError(
        `PDF conversion timed out after ${timeoutMs}ms`,
        'TIMEOUT'
      );
    }

    throw new PdfConversionError(
      error instanceof Error ? error.message : 'Network error during PDF conversion',
      'NETWORK_ERROR'
    );
  }
}

/**
 * Check if a MIME type is a PDF
 */
export function isPdfMimeType(mimeType: string | undefined): boolean {
  return mimeType === 'application/pdf';
}
