import * as AvatarPrimitive from '@radix-ui/react-avatar'
import * as React from 'react'

import { cn } from '@/lib/utils'

/** shadcn's avatar with a warm hairline ring instead of a shadow. */
function Avatar({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-card-edge',
        className
      )}
      {...props} />
  );
}

function AvatarImage({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('aspect-square size-full object-cover', className)}
      {...props} />
  );
}

function AvatarFallback({
  className,
  ...props
}) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // opaque, so faces overlapping in an AvatarGroup don't show through each other
        'flex size-full items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-[#1c2a47] dark:text-blue-200 dark:ring-blue-400/20',
        className
      )}
      {...props} />
  );
}

export { Avatar, AvatarFallback, AvatarImage }
