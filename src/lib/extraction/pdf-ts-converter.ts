/**
 * @deprecated This file is no longer used. Claude Vision API now supports
 * PDFs natively via DocumentBlockParam. Use extractG28WithClaude() from
 * claude-vision-client.ts instead.
 *
 * This file is kept for reference but should not be imported.
 * The pdfjs-dist worker initialization fails in Next.js server environment.
 *
 * Pure TypeScript PDF-to-image conversion using pdfjs-dist
 *
 * Replaces the Docker-based pdf-converter-client.ts with a native
 * Node.js implementation for PDF rendering.
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { createCanvas, type Canvas } from '@napi-rs/canvas';

// Disable worker for server-side usage
GlobalWorkerOptions.workerSrc = '';

/**
 * PDF conversion options
 */
export interface PdfConversionOptions {
  /** Scale factor for rendering (default: 2.0 for 144 DPI) */
  readonly scale: number;
  /** Maximum pages to process (default: 10) */
  readonly maxPages: number;
  /** Output image format */
  readonly format: 'png' | 'jpeg';
  /** JPEG quality if format is 'jpeg' (0-1) */
  readonly quality: number;
}

/**
 * Result of PDF conversion
 */
export interface PdfConversionResult {
  /** Base64-encoded page images */
  readonly pages: readonly string[];
  /** Total pages in the PDF */
  readonly pageCount: number;
  /** Number of pages actually processed */
  readonly processedCount: number;
}

/**
 * Default conversion options
 */
const DEFAULT_OPTIONS: PdfConversionOptions = {
  scale: 2.0, // 144 DPI for good Claude Vision accuracy
  maxPages: 10, // Safety limit to prevent memory issues
  format: 'png',
  quality: 0.92,
} as const;

/**
 * Error codes for PDF conversion failures
 */
export type PdfTsConversionErrorCode =
  | 'LOAD_FAILED'
  | 'RENDER_FAILED'
  | 'INVALID_PDF'
  | 'TOO_MANY_PAGES'
  | 'MEMORY_ERROR';

/**
 * Error thrown when PDF conversion fails
 */
export class PdfTsConversionError extends Error {
  constructor(
    message: string,
    public readonly code: PdfTsConversionErrorCode,
    public readonly pageNumber?: number
  ) {
    super(message);
    this.name = 'PdfTsConversionError';
  }
}

/**
 * Render a single PDF page to base64 image
 */
async function renderPageToBase64(
  page: PDFPageProxy,
  options: PdfConversionOptions
): Promise<string> {
  const viewport = page.getViewport({ scale: options.scale });

  // Create canvas with page dimensions
  const canvas: Canvas = createCanvas(
    Math.floor(viewport.width),
    Math.floor(viewport.height)
  );
  const context = canvas.getContext('2d');

  // Render the page
  await page.render({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasContext: context as any,
    viewport,
  }).promise;

  // Export as base64
  if (options.format === 'jpeg') {
    return canvas.toBuffer('image/jpeg', Math.round(options.quality * 100)).toString('base64');
  }
  return canvas.toBuffer('image/png').toString('base64');
}

/**
 * Convert a PDF buffer to an array of base64-encoded page images
 *
 * @param pdfBuffer - Raw PDF file bytes
 * @param options - Conversion options (optional)
 * @returns Conversion result with page images and metadata
 * @throws PdfTsConversionError if conversion fails
 *
 * @example
 * ```typescript
 * const buffer = await fs.readFile('document.pdf');
 * const result = await convertPdfToImagesTS(buffer);
 * console.log(`Processed ${result.processedCount} of ${result.pageCount} pages`);
 * ```
 */
export async function convertPdfToImagesTS(
  pdfBuffer: Buffer,
  options: Partial<PdfConversionOptions> = {}
): Promise<PdfConversionResult> {
  const opts: PdfConversionOptions = { ...DEFAULT_OPTIONS, ...options };

  let pdf: PDFDocumentProxy | null = null;

  try {
    // Load the PDF document
    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      // Disable features not needed for image rendering
      disableFontFace: true,
    });

    try {
      pdf = await loadingTask.promise;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unknown error';

      // Check for password-protected PDF
      if (message.includes('password')) {
        throw new PdfTsConversionError(
          'PDF is password-protected and cannot be processed',
          'INVALID_PDF'
        );
      }

      throw new PdfTsConversionError(
        `Failed to load PDF: ${message}`,
        'LOAD_FAILED'
      );
    }

    const pageCount = pdf.numPages;
    const pagesToProcess = Math.min(pageCount, opts.maxPages);
    const pages: string[] = [];

    console.log(`[PDF Converter] Processing ${pagesToProcess} of ${pageCount} pages`);

    // Process each page sequentially to manage memory
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);

        try {
          const base64 = await renderPageToBase64(page, opts);
          pages.push(base64);
          console.log(`[PDF Converter] Page ${pageNum}/${pagesToProcess} converted`);
        } finally {
          // Release page resources
          page.cleanup();
        }
      } catch (pageError) {
        if (pageError instanceof PdfTsConversionError) {
          throw pageError;
        }

        throw new PdfTsConversionError(
          `Failed to render page ${pageNum}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`,
          'RENDER_FAILED',
          pageNum
        );
      }
    }

    return {
      pages,
      pageCount,
      processedCount: pages.length,
    };
  } finally {
    // Always cleanup the PDF document
    if (pdf) {
      try {
        await pdf.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if a MIME type represents a PDF
 */
export function isPdfMimeType(mimeType: string | undefined): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Check if a buffer appears to be a valid PDF (by magic bytes)
 */
export function isValidPdfBuffer(buffer: Buffer): boolean {
  // PDF files start with '%PDF-'
  if (buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}
