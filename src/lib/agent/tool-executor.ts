/**
 * Client-side tool execution for browser agent
 *
 * IMPORTANT: Tools that open browser tabs MUST be executed from user-initiated
 * events (clicks) to bypass popup blockers. The useBrowserAgent hook queues
 * these tool calls and provides a button for the user to execute them.
 */

import {
  htmlContentSchema,
  type ToolExecutionResult,
  type BrowserToolName,
} from './tools';
import { sanitizeHtmlContent } from './sanitizer';

// =============================================================================
// TOOL EXECUTION
// =============================================================================

/**
 * Execute a tool call client-side
 *
 * @param toolName - The name of the tool to execute
 * @param args - The arguments passed by the AI
 * @returns Result of the execution
 *
 * IMPORTANT: Must be called from user-initiated event (click) to bypass popup blocker
 */
export function executeToolCall(
  toolName: BrowserToolName,
  args: Record<string, unknown>
): ToolExecutionResult {
  switch (toolName) {
    case 'openTabWithContent':
      return executeOpenTabWithContent(args);
    default:
      return {
        success: false,
        toolName,
        message: 'Unknown tool',
        error: `Tool "${toolName}" is not implemented`,
      };
  }
}

/**
 * Execute the openTabWithContent tool
 *
 * Opens a new browser tab with sanitized AI-generated HTML content
 */
function executeOpenTabWithContent(
  args: Record<string, unknown>
): ToolExecutionResult {
  // Validate arguments with Zod
  const parseResult = htmlContentSchema.safeParse(args);
  if (!parseResult.success) {
    return {
      success: false,
      toolName: 'openTabWithContent',
      message: 'Invalid tool arguments',
      error: parseResult.error.issues.map((i) => i.message).join(', '),
    };
  }

  const content = parseResult.data;

  try {
    // Sanitize content for XSS protection
    const sanitizedHtml = sanitizeHtmlContent(content);

    // Create a data URL with the sanitized HTML
    // This approach works better than document.write for some browsers
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(sanitizedHtml)}`;

    // Open new tab - must be called from user click to bypass popup blocker
    const newWindow = window.open(dataUrl, '_blank');

    if (!newWindow) {
      return {
        success: false,
        toolName: 'openTabWithContent',
        message: 'Popup blocked',
        error:
          'The browser blocked the popup. Please allow popups for this site and try again.',
      };
    }

    return {
      success: true,
      toolName: 'openTabWithContent',
      message: `Opened new tab: "${content.title}"`,
    };
  } catch (error) {
    return {
      success: false,
      toolName: 'openTabWithContent',
      message: 'Failed to open tab',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// =============================================================================
// TOOL UTILITIES
// =============================================================================

/**
 * Check if a tool requires user interaction (click) to execute
 *
 * All browser-opening tools require this to bypass popup blockers
 */
export function toolRequiresUserClick(toolName: BrowserToolName): boolean {
  // Currently all tools require user click for popup bypass
  return toolName === 'openTabWithContent';
}

/**
 * Get a human-readable description of what a tool will do
 */
export function getToolActionDescription(
  toolName: BrowserToolName,
  args: Record<string, unknown>
): string {
  switch (toolName) {
    case 'openTabWithContent': {
      const title =
        typeof args.title === 'string' ? args.title : 'Untitled Document';
      return `Open new tab with "${title}"`;
    }
    default:
      return `Execute ${toolName}`;
  }
}
