/**
 * Streaming chat API route with tool calling
 *
 * Uses Vercel AI SDK to stream responses from Gemini with browser tool support.
 * Tool execution happens client-side via the useBrowserAgent hook.
 */

import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { browserTools } from '@/lib/agent/tools';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

/**
 * Schema for chat request validation
 */
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
});

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are a helpful browser assistant that can open new tabs with generated content.

When the user asks you to create documents, reports, guides, or display any formatted information, use the openTabWithContent tool to show them well-structured HTML content.

Guidelines for content generation:
- Generate semantic, accessible HTML with proper heading hierarchy
- Include inline styles or a <style> block for formatting
- Use clear typography and good visual hierarchy
- Never include external resources, scripts, or iframes
- Keep content focused and well-organized
- Use tables for structured data, lists for enumeration
- Include code blocks with syntax highlighting styles when showing code

Example use cases:
- "Create a React tutorial" → Generate a formatted guide with code examples
- "Make a comparison table" → Generate a styled table with the comparison
- "Write meeting notes" → Generate a formatted document with sections

Always explain briefly what you're creating before using the tool.`;

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = chatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = parseResult.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');

      return Response.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request format',
            details: errors,
          },
        },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('[Chat API] GOOGLE_GENERATIVE_AI_API_KEY not configured');
      return Response.json(
        {
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'AI service not configured',
          },
        },
        { status: 500 }
      );
    }

    const { messages } = parseResult.data;

    // Stream response with tool calling
    const result = streamText({
      model: google(process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'),
      system: SYSTEM_PROMPT,
      messages,
      tools: {
        openTabWithContent: tool({
          description: browserTools.openTabWithContent.description,
          parameters: browserTools.openTabWithContent.parameters,
        }),
      },
      maxSteps: 3, // Allow multi-step tool calling if needed
    });

    return result.toDataStreamResponse();
  } catch (error) {
    // Log error without PII (following existing pattern)
    console.error('[Chat API] Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
