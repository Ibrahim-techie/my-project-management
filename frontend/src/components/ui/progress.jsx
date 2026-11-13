'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * How far along something is, as a thin cobalt bar. Give it an aria-label
 * or put a visible label next to it.
 */
function Progress({
  value = 0,
  max = 100,
  className,
  ...props
}) {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / (max ?? 100)) * 100))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      {...props}>
      <ProgressPrimitive.Indicator
        className="h-full w-full rounded-full bg-highlight transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${100 - pct}%)` }} />
    </ProgressPrimitive.Root>
  );
}

export { Progress }
