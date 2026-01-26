'use client';

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface RadioOption {
  readonly value: string;
  readonly label: string;
}

interface RadioGroupProps {
  readonly name: string;
  readonly label?: string;
  readonly options: readonly RadioOption[];
  readonly value?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly onChange?: (value: string) => void;
  readonly className?: string;
  readonly inline?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { name, label, options, value, error, required, disabled, onChange, className, inline },
  ref
) {
  const groupId = name;

  // Inline mode: no label wrapper, horizontal layout
  if (inline) {
    return (
      <div ref={ref} className={cn('inline-flex gap-4', className)} role="radiogroup">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              onChange={(e) => onChange?.(e.target.value)}
              className={cn(
                'h-4 w-4 border-zinc-300 text-alma-primary',
                'focus:ring-2 focus:ring-alma-focus focus:ring-offset-2',
                'dark:border-zinc-600 dark:bg-zinc-800',
                error && 'border-red-500'
              )}
            />
            {option.label}
          </label>
        ))}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('flex flex-col gap-2', className)} role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined}>
      {label && (
        <span id={`${groupId}-label`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
      )}
      <div className="flex gap-4">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              onChange={(e) => onChange?.(e.target.value)}
              className={cn(
                'h-4 w-4 border-zinc-300 text-alma-primary',
                'focus:ring-2 focus:ring-alma-focus focus:ring-offset-2',
                'dark:border-zinc-600 dark:bg-zinc-800',
                error && 'border-red-500'
              )}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});
