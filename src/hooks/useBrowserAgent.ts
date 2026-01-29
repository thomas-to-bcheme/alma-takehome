/**
 * Browser agent hook for managing chat state and tool execution
 *
 * Uses Vercel AI SDK's useChat hook for streaming and adds support
 * for queuing tool calls that require user interaction (popup bypass).
 */

'use client';

import { useChat } from 'ai/react';
import { useState, useCallback, useRef } from 'react';
import type { Message } from 'ai';
import {
  executeToolCall,
  toolRequiresUserClick,
  getToolActionDescription,
} from '@/lib/agent/tool-executor';
import type { BrowserToolName, ToolExecutionResult } from '@/lib/agent/tools';

// =============================================================================
// TYPES
// =============================================================================

/**
 * A tool call that is pending user confirmation
 */
export interface PendingToolCall {
  readonly id: string;
  readonly toolName: BrowserToolName;
  readonly args: Record<string, unknown>;
  readonly description: string;
}

/**
 * Agent state for UI display
 */
export type AgentStatus = 'idle' | 'thinking' | 'awaiting-action' | 'error';

/**
 * Options for useBrowserAgent hook
 */
export interface UseBrowserAgentOptions {
  readonly initialMessages?: Message[];
  readonly onToolExecuted?: (result: ToolExecutionResult) => void;
  readonly onError?: (error: Error) => void;
}

/**
 * Return type for useBrowserAgent hook
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

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useBrowserAgent(
  options: UseBrowserAgentOptions = {}
): UseBrowserAgentReturn {
  const { initialMessages, onToolExecuted, onError } = options;

  // State for pending tool calls (queued for user click)
  const [pendingToolCall, setPendingToolCall] = useState<PendingToolCall | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Ref to hold pending tool call (avoids stale closure in callbacks)
  const pendingToolCallRef = useRef<PendingToolCall | null>(null);

  // Use Vercel AI SDK's useChat hook
  const {
    messages,
    input,
    setInput,
    append,
    setMessages,
    isLoading,
  } = useChat({
    api: '/api/chat',
    initialMessages,
    onResponse: () => {
      // Clear any previous error when new response starts
      setError(null);
    },
    onFinish: (message) => {
      // Check for tool invocations in the message
      // The Vercel AI SDK attaches toolInvocations to the message
      const messageWithTools = message as Message & {
        toolInvocations?: Array<{
          toolCallId: string;
          toolName: string;
          args: Record<string, unknown>;
          state: 'call' | 'result';
        }>;
      };

      const toolInvocations = messageWithTools.toolInvocations;
      if (toolInvocations && toolInvocations.length > 0) {
        // Find the first tool call that hasn't been executed yet
        const pendingInvocation = toolInvocations.find(
          (inv) => inv.state === 'call'
        );

        if (pendingInvocation) {
          const toolName = pendingInvocation.toolName as BrowserToolName;

          if (toolRequiresUserClick(toolName)) {
            // Queue the tool call for user-initiated execution
            const pending: PendingToolCall = {
              id: pendingInvocation.toolCallId,
              toolName,
              args: pendingInvocation.args,
              description: getToolActionDescription(
                toolName,
                pendingInvocation.args
              ),
            };
            pendingToolCallRef.current = pending;
            setPendingToolCall(pending);
          }
        }
      }
    },
    onError: (err) => {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      onError?.(err);
    },
  });

  /**
   * Submit the current input as a user message
   */
  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    if (pendingToolCall) return; // Don't allow new messages while tool is pending

    setError(null);
    append({ role: 'user', content: input });
    setInput('');
  }, [input, append, setInput, pendingToolCall]);

  /**
   * Execute the pending tool call (must be called from user click)
   */
  const executePendingTool = useCallback(() => {
    const toolCall = pendingToolCallRef.current;
    if (!toolCall) return;

    // Execute the tool
    const result = executeToolCall(toolCall.toolName, toolCall.args);

    // Clear pending state
    pendingToolCallRef.current = null;
    setPendingToolCall(null);

    // Notify callback
    onToolExecuted?.(result);

    // Add a message about the tool execution result
    const resultMessage = result.success
      ? `✓ ${result.message}`
      : `✗ ${result.error || result.message}`;

    append({
      role: 'assistant',
      content: resultMessage,
    });
  }, [onToolExecuted, append]);

  /**
   * Clear all messages and reset state
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingToolCall(null);
    pendingToolCallRef.current = null;
    setError(null);
  }, [setMessages]);

  // Compute current status
  const status: AgentStatus = error
    ? 'error'
    : pendingToolCall
      ? 'awaiting-action'
      : isLoading
        ? 'thinking'
        : 'idle';

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    pendingToolCall,
    executePendingTool,
    clearMessages,
    isLoading,
    status,
    error,
  };
}
