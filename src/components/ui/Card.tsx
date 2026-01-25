import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps): React.JSX.Element {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps): React.JSX.Element {
  return (
    <h3
      className={cn('text-lg font-semibold text-zinc-900 dark:text-zinc-50', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children: ReactNode;
}

export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps): React.JSX.Element {
  return (
    <p className={cn('mt-1 text-sm text-zinc-500 dark:text-zinc-400', className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps): React.JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
