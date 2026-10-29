import { cva } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A message in the flow of the page: a notice, a warning, a failure. Like
 * every status in ChaiUI it is a thin coloured outline and coloured text on
 * the page background, never a filled block. Tones use the status palette at low opacity.
 */
const alertVariants = cva('relative flex gap-3 rounded-xl border px-4 py-3 text-sm', {
  variants: {
    tone: {
      info: 'border-border bg-card text-foreground [&>svg]:text-brand-cyan',
      success: 'border-status-done/30 bg-status-done/8 text-foreground [&>svg]:text-status-done',
      warning: 'border-priority-medium/35 bg-priority-medium/8 text-foreground [&>svg]:text-priority-medium',
      danger: 'border-danger/35 bg-danger/8 text-foreground [&>svg]:text-danger',
    },
  },
  defaultVariants: { tone: 'info' },
})

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert }

function Alert({
  tone = 'info',
  title,
  className,
  children,
  ...props
}) {
  const Icon = icons[tone ?? 'info']
  return (
    <div
      data-slot="alert"
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(alertVariants({ tone }), className)}
      {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-montserrat font-semibold">{title}</p>}
        {children && <div className="leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export { Alert, alertVariants }
