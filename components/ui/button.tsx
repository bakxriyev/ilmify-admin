import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ground)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(10_60_160/0.25),0_4px_12px_-4px_rgb(10_100_255/0.45)]',
        destructive: 'bg-[var(--bad)] text-white hover:brightness-95 shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_1px_2px_rgb(160_20_30/0.25)]',
        outline: 'border border-[var(--border-strong)] bg-[color-mix(in_oklab,var(--card)_80%,transparent)] text-[var(--foreground)] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_1px_2px_rgb(15_23_42/0.05)] hover:bg-[var(--card)] hover:border-[color-mix(in_oklab,var(--foreground)_22%,transparent)] dark:shadow-none',
        secondary: 'bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_11%,transparent)]',
        ghost: 'text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]',
        link: 'text-[var(--accent-ink)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-[11px] px-3',
        lg: 'h-11 rounded-[14px] px-7 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
