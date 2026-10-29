import * as React from 'react'

import { cn } from '@/lib/utils'

/** A grey block that stands in for content while it loads. It pulses gently, and holds still for reduced motion. */
function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'rounded-md bg-secondary motion-safe:animate-pulse',
        className
      )}
      {...props} />
  );
}

export { Skeleton }
