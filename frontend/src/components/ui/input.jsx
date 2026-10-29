import * as React from 'react'

import { cn } from '@/lib/utils'

/** The text field used across forms and toolbars, on the input surface colour. */
const inputClass =
  'h-9 w-full min-w-0 rounded-lg border border-border bg-input-bg px-3 text-sm text-foreground transition-colors duration-150 outline-none placeholder:text-muted-foreground hover:border-card-edge-hover focus-visible:border-primary/70 focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25'

function Input({
  className,
  type = 'text',
  ...props
}) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(inputClass, className)}
      {...props} />
  );
}

export { Input, inputClass }
