import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A row of mutually exclusive options (filters, a status picker). The
 * selected segment takes the teal tint used for active states app-wide.
 */
function Segmented(
  {
    options,
    value,
    onChange,
    label,
    className
  }
) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="segmented"
      className={cn(
        'flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border bg-input-bg p-0.5 [scrollbar-width:none]',
        className
      )}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          aria-label={o['aria-label']}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-8 min-w-8 rounded-md shrink-0 cursor-pointer items-center justify-center gap-2 px-3.5 text-[13px] whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset [&_svg:not([class*='size-'])]:size-4",
            value === o.value
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-subtle-foreground hover:bg-secondary hover:text-foreground'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export { Segmented }
