'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { FormFillResult, FieldResult } from '@/types';

interface ScreenshotPreviewProps {
  readonly result: FormFillResult;
  readonly onClose?: () => void;
}

export function ScreenshotPreview({
  result,
  onClose,
}: ScreenshotPreviewProps): React.JSX.Element {
  const [showDetails, setShowDetails] = useState(false);

  const handleDownload = useCallback(() => {
    if (!result.screenshotBase64) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.screenshotBase64}`;
    link.download = `form-screenshot-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result.screenshotBase64]);

  const filledCount = result.filledFields.length;
  const skippedCount = result.skippedFields.length;
  const failedCount = result.failedFields.length;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-full p-1',
              result.success
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            )}
          >
            {result.success ? (
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {result.success ? 'Form Filled Successfully' : 'Form Fill Completed with Errors'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Completed in {(result.durationMs / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            aria-label="Close preview"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Field Summary */}
      <div className="flex gap-4 border-b border-zinc-200 p-4 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {filledCount}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Filled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {skippedCount}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Skipped</span>
        </div>
        {failedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {failedCount}
            </span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Failed</span>
          </div>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-auto text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="max-h-48 overflow-y-auto border-b border-zinc-200 p-4 dark:border-zinc-700">
          <FieldList title="Filled Fields" fields={result.filledFields} variant="success" />
          <FieldList title="Skipped Fields" fields={result.skippedFields} variant="warning" />
          {failedCount > 0 && (
            <FieldList title="Failed Fields" fields={result.failedFields} variant="error" />
          )}
        </div>
      )}

      {/* Screenshot */}
      {result.screenshotBase64 && (
        <div className="p-4">
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <img
              src={`data:image/png;base64,${result.screenshotBase64}`}
              alt="Filled form screenshot"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-700">
        {result.screenshotBase64 && (
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Download Screenshot
          </button>
        )}
      </div>
    </div>
  );
}

interface FieldListProps {
  readonly title: string;
  readonly fields: readonly FieldResult[];
  readonly variant: 'success' | 'warning' | 'error';
}

function FieldList({ title, fields, variant }: FieldListProps): React.JSX.Element | null {
  if (fields.length === 0) return null;

  const colorClasses = {
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    error: 'text-red-700 dark:text-red-400',
  };

  return (
    <div className="mb-3 last:mb-0">
      <h4 className={cn('mb-1 text-xs font-medium', colorClasses[variant])}>
        {title} ({fields.length})
      </h4>
      <ul className="space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
        {fields.slice(0, 10).map((field) => (
          <li key={field.fieldName} className="flex items-center gap-2">
            <span className="font-mono">{field.fieldName}</span>
            {field.error && (
              <span className="text-red-500 dark:text-red-400">- {field.error}</span>
            )}
          </li>
        ))}
        {fields.length > 10 && (
          <li className="text-zinc-400">...and {fields.length - 10} more</li>
        )}
      </ul>
    </div>
  );
}
