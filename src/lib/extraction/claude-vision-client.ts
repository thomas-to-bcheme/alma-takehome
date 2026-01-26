/**
 * Direct Claude Vision API client for G-28 data extraction
 *
 * Calls Claude Vision API directly from Next.js server-side,
 * bypassing the Docker service. This avoids any billing/key issues
 * with the Docker container's environment.
 */

import Anthropic from '@anthropic-ai/sdk';

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
 * Error thrown when Claude Vision extraction fails
 */
export class ClaudeVisionError extends Error {
  constructor(
    message: string,
    public readonly code: 'API_ERROR' | 'PARSE_ERROR' | 'DISABLED' | 'NO_API_KEY',
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ClaudeVisionError';
  }
}

/**
 * Check if Claude Vision is enabled (API key is available)
 */
export function isClaudeVisionEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Create Anthropic client with server-side API key
 */
function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeVisionError('ANTHROPIC_API_KEY not configured', 'NO_API_KEY');
  }
  return new Anthropic({ apiKey });
}

/**
 * The extraction prompt for G-28 form data
 */
const G28_EXTRACTION_PROMPT = `Extract G-28 form data from this image. Return a JSON object with these fields:
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
- Only include fields that are clearly visible on the form
- Use empty string "" for missing text fields
- Return ONLY the JSON object, no markdown formatting or explanation
- If a checkbox is clearly marked/checked, set the corresponding boolean to true`;

/**
 * Extract G-28 data from a single page image using Claude Vision
 *
 * @param pageBase64 - Base64-encoded image data (without data URL prefix)
 * @param mediaType - MIME type of the image (e.g., 'image/png', 'image/jpeg')
 * @returns Partial G28 data extracted from the page
 */
export async function extractG28PageWithClaude(
  pageBase64: string,
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'image/png'
): Promise<Partial<G28PageData>> {
  if (!isClaudeVisionEnabled()) {
    throw new ClaudeVisionError('Claude Vision is not enabled', 'DISABLED');
  }

  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: pageBase64,
              },
            },
            {
              type: 'text',
              text: G28_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new ClaudeVisionError('No text response from Claude', 'API_ERROR');
    }

    const responseText = textBlock.text.trim();
    console.log('[Claude Vision] Raw response:', responseText);

    // Parse JSON response - try to handle cases where Claude wraps in markdown
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonText) as G28PageData;
      console.log('[Claude Vision] Parsed data:', JSON.stringify(parsed, null, 2));
      return parsed;
    } catch (parseError) {
      console.error('[Claude Vision] Failed to parse JSON:', parseError);
      throw new ClaudeVisionError(
        `Failed to parse Claude response as JSON: ${responseText.substring(0, 200)}`,
        'PARSE_ERROR'
      );
    }
  } catch (error) {
    if (error instanceof ClaudeVisionError) {
      throw error;
    }

    // Handle Anthropic API errors
    if (error instanceof Anthropic.APIError) {
      console.error('[Claude Vision] API error:', error.status, error.message);
      throw new ClaudeVisionError(
        `Claude API error: ${error.message}`,
        'API_ERROR',
        error.status
      );
    }

    console.error('[Claude Vision] Unexpected error:', error);
    throw new ClaudeVisionError(
      error instanceof Error ? error.message : 'Unknown error',
      'API_ERROR'
    );
  }
}
