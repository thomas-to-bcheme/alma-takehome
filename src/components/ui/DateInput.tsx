'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  readonly label: string;
  readonly error?: string;
  readonly required?: boolean;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, error, required, className, id, ...props },
  ref
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        ref={ref}
        type="date"
        id={inputId}
        className={cn(
          'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900',
          'focus:border-alma-focus focus:outline-none focus:ring-1 focus:ring-alma-focus',
          'disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500',
          'dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100',
          'dark:focus:border-alma-focus dark:focus:ring-alma-focus',
          '[&::-webkit-calendar-picker-indicator]:dark:invert',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});
