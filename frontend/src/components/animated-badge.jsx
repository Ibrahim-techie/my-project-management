import { motion } from 'motion/react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A status pill that announces what sits below it: a slate pill on a
 * hairline with a pulsing cobalt dot. It fades in; the pulse stops for
 * reduced motion. Use one per screen.
 */
export function AnimatedBadge({
  children,
  className
}) {
  return (
    <motion.span
      className={cn(
        'inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground',
        className
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-highlight opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-highlight" />
      </span>
      {children}
    </motion.span>
  );
}
