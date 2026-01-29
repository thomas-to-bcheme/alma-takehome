/**
 * Type definitions for the browser agent system
 */

import type { Message } from 'ai';
import type { ToolExecutionResult, BrowserToolName } from '@/lib/agent/tools';

// =============================================================================
// AGENT STATE TYPES
// =============================================================================

/**
 * Current status of the browser agent
 */
export type AgentStatus = 'idle' | 'thinking' | 'awaiting-action' | 'error';

/**
 * Complete agent state
 */
export interface AgentState {
  readonly status: AgentStatus;
  readonly error: string | null;
  readonly pendingToolCall: PendingToolCall | null;
}

/**
 * A tool call that is pending user confirmation
 */
export interface PendingToolCall {
  readonly id: string;
  readonly toolName: BrowserToolName;
  readonly args: Record<string, unknown>;
  readonly description: string;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Props for the BrowserAgent component
 */
export interface BrowserAgentProps {
  readonly className?: string;
  readonly initialMessages?: Message[];
  readonly onToolExecuted?: (result: ToolExecutionResult) => void;
}

/**
 * Props for chat message display
 */
export interface ChatMessageProps {
  readonly message: Message;
  readonly isLatest: boolean;
}

/**
 * Props for chat input
 */
export interface ChatInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly disabled: boolean;
  readonly placeholder?: string;
}

/**
 * Props for tool call indicator
 */
export interface ToolCallIndicatorProps {
  readonly toolCall: PendingToolCall;
  readonly onExecute: () => void;
  readonly isExecuting: boolean;
}

// =============================================================================
// HOOK TYPES
// =============================================================================

/**
 * Options for the useBrowserAgent hook
 */
export interface UseBrowserAgentOptions {
  readonly initialMessages?: Message[];
  readonly onToolExecuted?: (result: ToolExecutionResult) => void;
  readonly onError?: (error: Error) => void;
}

/**
 * Return type for the useBrowserAgent hook
 */
export interface UseBrowserAgentReturn {
  readonly messages: Message[];
  readonly input: string;
  readonly setInput: (value: string) => void;
  readonly handleSubmit: () => void;
  readonly pendingToolCall: PendingToolCall | null;
  readonly executePendingTool: () => void;
  readonly clearMessages: () => void;
  readonly isLoading: boolean;
  readonly status: AgentStatus;
  readonly error: string | null;
}

// Re-export tool types for convenience
export type { ToolExecutionResult, BrowserToolName };
