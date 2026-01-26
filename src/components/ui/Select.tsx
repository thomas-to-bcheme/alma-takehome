'use client';

import { cn } from '@/lib/utils';
import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  readonly label: string;
  readonly options: readonly SelectOption[];
  readonly error?: string;
  readonly required?: boolean;
  readonly placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, required, placeholder, className, id, ...props },
  ref
) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900',
          'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          'disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500',
          'dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100',
          'dark:focus:border-blue-400 dark:focus:ring-blue-400',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});
