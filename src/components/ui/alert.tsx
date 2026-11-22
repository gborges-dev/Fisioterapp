import * as React from 'react'

import { cn } from '@/lib/utils'

function Alert({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'destructive' | 'warning'
}) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-2xl border px-4 py-3 text-sm glass-subtle [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
        variant === 'destructive' &&
          'border-destructive/40 bg-[var(--attention-soft)] text-[var(--attention-ink)] [&>svg]:text-[var(--attention-ink)]',
        variant === 'warning' &&
          'border-chart-4/50 bg-[var(--attention-soft)] text-foreground [&>svg]:text-chart-4',
        className,
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight display', className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
