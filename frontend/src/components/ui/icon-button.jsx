import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority';
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The size-9 square in listing toolbars (sort, filters). `boxed` has the
 * toolbar hairline; `ghost` is bare, for headers. Give it an aria-label.
 */
const iconButtonVariants = cva(
  "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        boxed:
          'border border-border bg-input-bg text-subtle-foreground hover:bg-secondary hover:text-foreground',
        ghost: 'text-subtle-foreground hover:bg-secondary hover:text-foreground',
      },
    },
    defaultVariants: { variant: 'boxed' },
  }
)

function IconButton({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="icon-button"
      type={asChild ? undefined : 'button'}
      className={cn(iconButtonVariants({ variant }), className)}
      {...props} />
  );
}

export { IconButton, iconButtonVariants }
