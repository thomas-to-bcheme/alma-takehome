'use client';

import { cn } from '@/lib/utils';
import type { UploadStatus } from '@/types';

interface UploadProgressProps {
  readonly status: UploadStatus;
}

export function UploadProgress({ status }: UploadProgressProps): React.JSX.Element | null {
  if (status === 'idle') {
    return null;
  }

  const isUploading = status === 'uploading';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-3',
        isUploading && 'bg-blue-50 dark:bg-blue-900/20',
        status === 'success' && 'bg-green-50 dark:bg-green-900/20',
        status === 'error' && 'bg-red-50 dark:bg-red-900/20'
      )}
    >
      {isUploading && (
        <>
          <svg
            className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Processing documents...
          </span>
        </>
      )}

      {status === 'success' && (
        <>
          <svg
            className="h-5 w-5 text-green-600 dark:text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Extraction complete
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <svg
            className="h-5 w-5 text-red-600 dark:text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Extraction failed
          </span>
        </>
      )}
    </div>
  );
}
