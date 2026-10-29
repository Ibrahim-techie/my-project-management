'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Tabs on Radix: arrow keys move between them, Home and End jump to the ends.
 *
 * - `variant="line"` (default): grey text, the active tab in white with a
 *   1px white rule under it. For sections of a page.
 * - `variant="segmented"`: the toolbar box with the warm brown active
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
            ? 'gap-5 border-b border-border'
            : 'w-fit rounded-lg border border-border bg-input-bg p-0.5',
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
          ? '-mb-px border-b border-transparent pt-1 pb-2.5 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-brand data-[state=active]:text-foreground'
          : 'h-8 rounded-md px-3.5 text-[13px] text-subtle-foreground hover:text-foreground focus-visible:ring-inset data-[state=active]:bg-accent data-[state=active]:text-accent-foreground',
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
