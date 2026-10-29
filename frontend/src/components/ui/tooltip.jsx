'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A short label on hover or focus, for icon buttons and abbreviations. Not
 * for anything people must read to use the page: touch screens never see it.
 * Inverted (white on dark), small, no arrow, no shadow.
 */
function TooltipProvider({
  delayDuration = 200,
  ...props
}) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

function Tooltip(props) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

const TooltipTrigger = TooltipPrimitive.Trigger

function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-xs rounded-md border border-border bg-elevated px-2.5 py-1.5 text-xs text-foreground shadow-md motion-safe:animate-chai-fade',
          className
        )}
        {...props} />
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
