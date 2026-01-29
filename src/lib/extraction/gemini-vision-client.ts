/**
 * Gemini Vision API client for document data extraction
 *
 * Uses Vercel AI SDK with Google provider for vision processing.
 * Supports both PDF documents and images natively.
 *
 * Extracts data from:
 * - Passports (MRZ + visual data)
 * - G-28 immigration forms
 */

import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

/**
 * Supported media types for Gemini Vision extraction
 * - Images: png, jpeg, gif, webp
 * - Documents: pdf (native support in Gemini)
 */
export type SupportedMediaType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf';

/**
 * Passport data structure extracted by Gemini Vision
 */
export interface PassportPageData {
  readonly documentType?: string;
  readonly issuingCountry?: string;
  readonly surname?: string;
  readonly givenNames?: string;
  readonly documentNumber?: string;
  readonly nationality?: string;
  readonly dateOfBirth?: string;
  readonly sex?: string;
  readonly expirationDate?: string;
}

/**
 * G-28 data structure extracted from a page
 */
export interface G28PageData {
  readonly attorneyName?: string;
  readonly firmName?: string;
  readonly street?: string;
  readonly suite?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly phone?: string;
  readonly fax?: string;
  readonly email?: string;
  readonly clientName?: string;
  readonly barNumber?: string;
  readonly licensingAuthority?: string;
  readonly isAttorney?: boolean;
  readonly isAccreditedRep?: boolean;
  readonly clientPhone?: string;
  readonly clientEmail?: string;
}

/**
 * Error thrown when Gemini Vision extraction fails
 */
export class GeminiVisionError extends Error {
  constructor(
    message: string,
    public readonly code: 'API_ERROR' | 'PARSE_ERROR' | 'DISABLED' | 'NO_API_KEY',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'GeminiVisionError';
  }
}

/**
 * Check if Gemini Vision is enabled (API key is available)
 */
export function isGeminiVisionEnabled(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/**
 * The extraction prompt for G-28 form data (supports multi-page documents)
 */
const G28_EXTRACTION_PROMPT = `Extract G-28 form data from this document. If the document has multiple pages, extract and combine data from all pages.

Return a JSON object with these fields:
- attorneyName: full name of attorney/representative
- firmName: law firm or organization name
- street: street address
- suite: suite/apartment number
- city: city
- state: state (2-letter code preferred)
- zipCode: ZIP code
- phone: phone number
- fax: fax number
- email: email address
- clientName: full name of the client/applicant
- barNumber: attorney bar number
- licensingAuthority: bar licensing authority
- isAttorney: true if representative is an attorney
- isAccreditedRep: true if representative is an accredited representative
- clientPhone: client's phone number
- clientEmail: client's email address

IMPORTANT:
- For multi-page documents, combine information from all pages
- Only include fields that are clearly visible on the form
- Use empty string "" for missing text fields
- Return ONLY the JSON object, no markdown formatting or explanation
- If a checkbox is clearly marked/checked, set the corresponding boolean to true`;

/**
 * Zod schema for passport extraction with generateObject
 * Field descriptions guide the model on what to extract
 */
const PassportExtractionSchema = z.object({
  documentType: z.string().describe('Type of document, e.g., "P" for passport'),
  issuingCountry: z.string().describe('3-letter country code of issuing country (e.g., USA, GBR, CAN)'),
  surname: z.string().describe('Family name / last name'),
  givenNames: z.string().describe('Given names / first and middle names'),
  documentNumber: z.string().describe('Passport number'),
  nationality: z.string().describe('3-letter nationality code (e.g., USA, GBR, CAN)'),
  dateOfBirth: z.string().describe('Date of birth in YYYY-MM-DD format'),
  sex: z.string().describe('M, F, or X'),
  expirationDate: z.string().describe('Expiration date in YYYY-MM-DD format'),
});

/**
 * The extraction prompt for passport data (used with generateObject)
 */
const PASSPORT_EXTRACTION_PROMPT = `Extract passport data from this image or document.

Read the Machine Readable Zone (MRZ) at the bottom of the passport if visible, and also extract visible text fields from the passport.

IMPORTANT:
- Convert all dates to YYYY-MM-DD format (e.g., "1990-01-15")
- For MRZ dates in YYMMDD format, assume years 00-30 are 2000s, 31-99 are 1900s
- Extract the full surname and given names, not abbreviated versions
- Use empty string "" for fields that cannot be read`;

/**
 * Extract passport data from an image/PDF using Gemini Vision
 * Uses generateObject for guaranteed structured JSON output
 *
 * @param fileBase64 - Base64-encoded file data (without data URL prefix)
 * @param mediaType - MIME type of the file
 * @returns Extracted passport data
 */
export async function extractPassportWithGemini(
  fileBase64: string,
  mediaType: SupportedMediaType
): Promise<Partial<PassportPageData>> {
  if (!isGeminiVisionEnabled()) {
    throw new GeminiVisionError('Gemini Vision is not enabled', 'DISABLED');
  }

  const isPdf = mediaType === 'application/pdf';
  console.log(`[Passport Extraction] Using Gemini Vision for ${isPdf ? 'PDF document' : mediaType + ' image'}...`);

  try {
    const result = await generateObject({
      model: google(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'),
      schema: PassportExtractionSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: Buffer.from(fileBase64, 'base64'),
              mimeType: mediaType,
            },
            {
              type: 'text',
              text: PASSPORT_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      maxTokens: 2048,
    });

    console.log('[Passport Extraction] Extracted data:', JSON.stringify(result.object, null, 2));
    return result.object;
  } catch (error) {
    if (error instanceof GeminiVisionError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Passport Extraction] Gemini API error:', errorMessage);

    const statusMatch = errorMessage.match(/status[:\s]+(\d+)/i);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;

    throw new GeminiVisionError(
      `Gemini API error: ${errorMessage}`,
      'API_ERROR',
      statusCode
    );
  }
}

/**
 * Extract G-28 data from a document using Gemini Vision
 * Supports both PDF files (natively) and images
 *
 * @param fileBase64 - Base64-encoded file data (without data URL prefix)
 * @param mediaType - MIME type of the file
 * @returns Extracted G28 data
 */
export async function extractG28WithGemini(
  fileBase64: string,
  mediaType: SupportedMediaType
): Promise<Partial<G28PageData>> {
  if (!isGeminiVisionEnabled()) {
    throw new GeminiVisionError('Gemini Vision is not enabled', 'DISABLED');
  }

  const isPdf = mediaType === 'application/pdf';
  console.log(`[Gemini Vision] Sending ${isPdf ? 'PDF document' : mediaType + ' image'} to Gemini...`);

  try {
    const result = await generateText({
      model: google(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: Buffer.from(fileBase64, 'base64'),
              mimeType: mediaType,
            },
            {
              type: 'text',
              text: G28_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      maxTokens: 2048,
    });

    const responseText = result.text.trim();
    console.log('[Gemini Vision] Raw response:', responseText);

    // Parse JSON response - handle cases where model wraps in markdown
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonText) as G28PageData;
      console.log('[Gemini Vision] Parsed data:', JSON.stringify(parsed, null, 2));
      return parsed;
    } catch (parseError) {
      console.error('[Gemini Vision] Failed to parse JSON:', parseError);
      throw new GeminiVisionError(
        `Failed to parse Gemini response as JSON: ${responseText.substring(0, 200)}`,
        'PARSE_ERROR'
      );
    }
  } catch (error) {
    if (error instanceof GeminiVisionError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Gemini Vision] API error:', errorMessage);

    // Extract status code from error message if present
    const statusMatch = errorMessage.match(/status[:\s]+(\d+)/i);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;

    throw new GeminiVisionError(
      `Gemini API error: ${errorMessage}`,
      'API_ERROR',
      statusCode
    );
  }
}
