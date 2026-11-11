import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * A panel that slides in from an edge: a phone menu, filters, a detail
 * view. Radix Dialog underneath, so focus is trapped and Escape closes it.
 * `side` picks the edge; the slide is skipped for reduced motion.
 */
const Drawer = DialogPrimitive.Root
const DrawerTrigger = DialogPrimitive.Trigger
const DrawerClose = DialogPrimitive.Close

const sides = {
  right: 'inset-y-0 right-0 h-full w-[min(24rem,90vw)] border-l motion-safe:data-[state=open]:animate-[chai-drawer-right_0.25s_ease-out]',
  left: 'inset-y-0 left-0 h-full w-[min(24rem,90vw)] border-r motion-safe:data-[state=open]:animate-[chai-drawer-left_0.25s_ease-out]',
  bottom: 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t motion-safe:data-[state=open]:animate-[chai-drawer-bottom_0.25s_ease-out]',
}

function DrawerContent({
  side = 'right',
  title,
  description,
  className,
  children,
  ...props
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-[4px] motion-safe:data-[state=open]:animate-chai-fade dark:bg-black/60" />
      <DialogPrimitive.Content
        data-slot="drawer"
        className={cn(
          'fixed z-[100] flex flex-col gap-4 overflow-y-auto border-border bg-elevated shadow-[0_20px_25px_-5px_rgb(15_23_42/0.1)] dark:shadow-black/50 p-6 text-card-foreground outline-none',
          sides[side],
          className
        )}
        {...props}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Close"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <X className="size-4" aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export { Drawer, DrawerClose, DrawerContent, DrawerTrigger }
