import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A row of mutually exclusive options (filters, a status picker), as a
 * slate tray with the selected segment raised in white.
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
        'flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg border border-border bg-secondary p-0.5 [scrollbar-width:none]',
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
            "inline-flex h-7 min-w-7 rounded-md shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset [&_svg:not([class*='size-'])]:size-4",
            value === o.value
              ? 'bg-elevated text-foreground shadow-[var(--shadow-card)] ring-1 ring-border'
              : 'text-muted-foreground hover:text-foreground'
          )}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export { Segmented }
