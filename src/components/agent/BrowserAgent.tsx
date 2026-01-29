/**
 * Browser Agent component
 *
 * A chat interface that allows users to interact with an AI assistant
 * that can generate and open HTML documents in new browser tabs.
 */

'use client';

import { useCallback } from 'react';
import { useBrowserAgent } from '@/hooks/useBrowserAgent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ToolExecutionResult } from '@/lib/agent/tools';

// =============================================================================
// TYPES
// =============================================================================

interface BrowserAgentProps {
  readonly className?: string;
  readonly onToolExecuted?: (result: ToolExecutionResult) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function BrowserAgent({
  className,
  onToolExecuted,
}: BrowserAgentProps): React.JSX.Element {
  const {
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
  } = useBrowserAgent({ onToolExecuted });

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <Card className={cn('flex flex-col h-[600px]', className)}>
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-700 pb-4">
        <CardTitle>Browser Agent</CardTitle>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearMessages}>
            Clear
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 pt-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
              <p className="font-medium">
                Ask me to create documents or content
              </p>
              <p className="text-sm mt-2">
                I can generate HTML documents and open them in new tabs.
              </p>
              <div className="mt-4 text-sm text-left max-w-md mx-auto space-y-1">
                <p className="font-medium text-zinc-600 dark:text-zinc-300">
                  Try asking:
                </p>
                <p>&quot;Create a React hooks cheat sheet&quot;</p>
                <p>&quot;Make a comparison table of JavaScript frameworks&quot;</p>
                <p>&quot;Write a project proposal template&quot;</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id ?? index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'bg-alma-primary text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isLoading && status === 'thinking' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mx-auto max-w-md p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Pending Tool Call Indicator */}
        {pendingToolCall && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              Ready to open new tab
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
              {pendingToolCall.description}
            </p>
            <Button size="sm" onClick={executePendingTool}>
              Open Tab
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create a document..."
            disabled={isLoading || pendingToolCall !== null}
            rows={1}
            className={cn(
              'flex-1 resize-none rounded-lg border border-zinc-300 dark:border-zinc-600',
              'bg-white dark:bg-zinc-800 px-3 py-2 text-sm',
              'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              'focus:border-alma-focus focus:outline-none focus:ring-1 focus:ring-alma-focus',
              'disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:text-zinc-500'
            )}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim() || pendingToolCall !== null}
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
