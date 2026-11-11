'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Tabs on Radix: arrow keys move between them, Home and End jump to the ends.
 *
 * - `variant="line"` (default): muted text, the active tab in full colour
 *   with a 2px cobalt rule under it. For sections of a page.
 * - `variant="segmented"`: the toolbar box with a raised white active
 *   segment, the same as Segmented. For switching views.
 */
const TabsVariant = React.createContext('line')

function Tabs({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...props} />
  );
}

function TabsList({
  className,
  variant = 'line',
  ...props
}) {
  return (
    <TabsVariant value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        className={cn(
          'flex max-w-full overflow-x-auto [scrollbar-width:none]',
          variant === 'line'
            ? 'gap-6 border-b border-border'
            : 'w-fit rounded-lg border border-border bg-secondary p-0.5',
          className
        )}
        {...props} />
    </TabsVariant>
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  const variant = React.use(TabsVariant)
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4",
        variant === 'line'
          ? '-mb-px border-b-2 border-transparent px-0.5 pt-1 pb-3 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-highlight data-[state=active]:text-foreground data-[state=active]:[&_svg]:text-highlight'
          : 'h-7 rounded-md px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground focus-visible:ring-inset data-[state=active]:bg-elevated data-[state=active]:text-foreground data-[state=active]:shadow-[var(--shadow-card)]',
        className
      )}
      {...props} />
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('outline-none focus-visible:ring-2 focus-visible:ring-ring/50', className)}
      {...props} />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
