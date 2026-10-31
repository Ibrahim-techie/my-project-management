import { Slot, Slottable } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority';
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Project Camp buttons.
 *
 * - `solid` is the primary action (Create, Save): the brand gradient with
 *   dark text and ChaiUI's asymmetric corners. Keep it to one or two per view.
 * - `soft` is the default secondary action: a dark surface with a hairline.
 * - `outline` is transparent with the mirrored corners; `ghost` has no chrome.
 * - `muted` is the quiet "View all" style link button.
 * - `danger` is for the confirm step of a destructive action.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,filter,transform] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        solid: 'btn-asym bg-brand-gradient font-semibold text-on-brand hover:brightness-110 active:brightness-95',
        soft: 'rounded-lg border border-border bg-elevated text-foreground hover:border-card-edge-hover hover:bg-secondary',
        outline: 'btn-asym-mirror border border-border bg-transparent text-foreground hover:bg-secondary',
        muted: 'rounded-lg bg-secondary text-subtle-foreground hover:text-foreground',
        ghost: 'rounded-lg text-subtle-foreground hover:bg-secondary hover:text-foreground',
        danger: 'rounded-lg bg-red-600 font-semibold text-white hover:bg-red-600/90 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-500/90',
      },
      size: {
        sm: 'h-8 gap-1.5 px-3',
        md: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'soft',
      size: 'md',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  iconRight,
  children,
  ...props
}) {
  const Comp = asChild ? Slot : 'button'
  const icon = iconRight
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}>
      <Slottable>{children}</Slottable>
      {icon ? (
        <span aria-hidden="true" className="-ml-1 inline-flex">
          {icon}
        </span>
      ) : null}
    </Comp>
  );
}

export { Button, buttonVariants }
