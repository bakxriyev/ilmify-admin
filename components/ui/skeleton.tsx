import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[12px] bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]', className)}
      {...props}
    />
  )
}

export { Skeleton }
