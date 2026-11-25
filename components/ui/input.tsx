import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[12px] px-3.5 py-2 text-sm border border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--card)_88%,transparent)] text-[var(--foreground)] shadow-[inset_0_1px_1px_rgb(15_23_42/0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--faint)] hover:border-[color-mix(in_oklab,var(--foreground)_22%,transparent)] focus-visible:outline-none focus-visible:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--bad)] file:border-0 file:bg-transparent file:text-sm file:font-medium',
          
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
