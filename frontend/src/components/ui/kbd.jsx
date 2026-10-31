import * as React from 'react'

import { cn } from '@/lib/utils'

/** A key on the keyboard, for shortcut hints: <Kbd>⌘</Kbd> <Kbd>K</Kbd>. */
function Kbd({
  className,
  ...props
}) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-input-bg px-1 font-mono text-[11px] text-muted-foreground',
        className
      )}
      {...props} />
  );
}

export { Kbd }
