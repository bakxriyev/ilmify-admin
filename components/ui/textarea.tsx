import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-[12px] px-3.5 py-2.5 text-base md:text-sm border border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--card)_88%,transparent)] text-[var(--foreground)] shadow-[inset_0_1px_1px_rgb(15_23_42/0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--faint)] hover:border-[color-mix(in_oklab,var(--foreground)_22%,transparent)] focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--bad)]',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

export { Textarea }
