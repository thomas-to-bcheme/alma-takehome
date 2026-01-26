'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  readonly label: string;
  readonly error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, className, id, ...props },
  ref
) {
  const checkboxId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300',
          props.disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={cn(
            'h-4 w-4 rounded border-zinc-300 text-alma-primary',
            'focus:ring-2 focus:ring-alma-focus focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-zinc-600 dark:bg-zinc-800',
            error && 'border-red-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error && (
        <p id={`${checkboxId}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});
