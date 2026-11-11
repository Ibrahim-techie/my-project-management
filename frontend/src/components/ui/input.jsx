import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * The text field used across forms and toolbars, on the input surface colour.
 * 16px text on phones: iOS Safari zooms the page into any field below that.
 * Slightly taller on phones for an easier tap target.
 */
const inputClass =
  'h-10 w-full min-w-0 rounded-lg border border-input bg-input-bg px-3 text-base text-foreground sm:h-9 sm:text-sm transition-colors duration-150 outline-none placeholder:text-muted-foreground/80 hover:border-muted-foreground/50 focus-visible:border-highlight focus-visible:ring-1 focus-visible:ring-highlight disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25'

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
