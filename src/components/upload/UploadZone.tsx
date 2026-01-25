'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { validateFile } from '@/lib/utils';
import type { DocumentType } from '@/types';

interface UploadZoneProps {
  readonly documentType: DocumentType;
  readonly accept: string;
  readonly onFileSelect: (file: File) => void;
  readonly onError: (message: string) => void;
  readonly disabled?: boolean;
  readonly hasFile?: boolean;
}

export function UploadZone({
  documentType,
  accept,
  onFileSelect,
  onError,
  disabled = false,
  hasFile = false,
}: UploadZoneProps): React.JSX.Element {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = documentType === 'passport' ? 'Passport' : 'G-28 Form';
  const description =
    documentType === 'passport'
      ? 'Upload passport image or PDF'
      : 'Upload G-28 authorization form (PDF)';

  const handleFile = useCallback(
    (file: File) => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        onError(validation.error ?? 'Invalid file');
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [disabled, handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
        isDragOver && !disabled
          ? 'border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-800'
          : 'border-zinc-300 dark:border-zinc-700',
        disabled && 'cursor-not-allowed opacity-50',
        hasFile && 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-900/20',
        !disabled && !hasFile && 'hover:border-zinc-400 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50'
      )}
      aria-label={`Upload ${label}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        disabled={disabled}
        aria-hidden="true"
      />

      <svg
        className={cn(
          'mb-3 h-10 w-10',
          hasFile ? 'text-green-500' : 'text-zinc-400 dark:text-zinc-500'
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {hasFile ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        )}
      </svg>

      <span className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
      <span className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        {hasFile ? 'Click to replace' : 'Drag & drop or click to browse'}
      </span>
    </div>
  );
}
