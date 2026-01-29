/**
 * Browser agent tool definitions with Zod schemas
 *
 * These tools are used by the AI to perform actions in the user's browser.
 * Tool execution happens client-side to bypass popup blockers via user clicks.
 */

import { z } from 'zod';

// =============================================================================
// TOOL PARAMETER SCHEMAS
// =============================================================================

/**
 * Schema for HTML content generation with safety constraints
 */
export const htmlContentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be under 50,000 characters'),
  styles: z
    .string()
    .max(10000, 'Styles must be under 10,000 characters')
    .optional(),
});

export type HtmlContent = z.infer<typeof htmlContentSchema>;

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

/**
 * Tool definitions for Vercel AI SDK
 * Each tool has: description, parameters (Zod schema)
 * Execution happens client-side via tool-executor.ts
 */
export const browserTools = {
  openTabWithContent: {
    description:
      'Opens a new browser tab with AI-generated HTML content. Use this to display formatted documents, reports, or interactive content to the user.',
    parameters: htmlContentSchema,
  },
} as const;

export type BrowserToolName = keyof typeof browserTools;

// =============================================================================
// TOOL RESULT TYPES
// =============================================================================

/**
 * Result of a client-side tool execution
 */
export interface ToolExecutionResult {
  readonly success: boolean;
  readonly toolName: BrowserToolName;
  readonly message: string;
  readonly error?: string;
}

// =============================================================================
// TOOL CONFIGURATION
// =============================================================================

/**
 * Configuration constants for tool execution
 */
export const TOOL_CONFIG = {
  /** Maximum content size for generated HTML */
  MAX_CONTENT_SIZE: 50000,
  /** Maximum style size for generated CSS */
  MAX_STYLE_SIZE: 10000,
} as const;
