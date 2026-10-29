import { cva } from 'class-variance-authority';
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A small label for metadata, roles and statuses. Status tones use the shared
 * status palette as text on a faint tint of the same colour.
 */
const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        default: 'border-border bg-secondary/60 text-subtle-foreground',
        brand: 'border-brand-teal/30 bg-brand-teal/10 text-accent-foreground',
        todo: 'border-status-todo/30 bg-status-todo/10 text-status-todo',
        in_progress: 'border-status-progress/30 bg-status-progress/10 text-status-progress',
        review: 'border-status-review/30 bg-status-review/10 text-status-review',
        done: 'border-status-done/30 bg-status-done/10 text-status-done',
        blocked: 'border-status-blocked/30 bg-status-blocked/10 text-status-blocked',
        success: 'border-status-done/30 bg-status-done/10 text-status-done',
        danger: 'border-danger/30 bg-danger/10 text-danger',
        special: 'border-status-review/30 bg-status-review/10 text-status-review',
      },
    },
    defaultVariants: { tone: 'default' },
  }
)

function Chip({
  className,
  tone,
  ...props
}) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ tone }), className)}
      {...props} />
  );
}

export { Chip, chipVariants }
