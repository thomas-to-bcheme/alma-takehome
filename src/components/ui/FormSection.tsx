'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface FormSectionProps {
  readonly title: string;
  readonly partNumber?: number;
  readonly children: ReactNode;
  readonly className?: string;
}

export function FormSection({
  title,
  partNumber,
  children,
  className,
}: FormSectionProps): React.JSX.Element {
  return (
    <section className={cn('overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700', className)}>
      <header className="bg-[#003366] px-4 py-2 text-white">
        <h2 className="text-lg font-semibold">
          {partNumber !== undefined && `Part ${partNumber}. `}
          {title}
        </h2>
      </header>
      <div className="bg-[#fafafa] p-4 dark:bg-zinc-800">
        {children}
      </div>
    </section>
  );
}
