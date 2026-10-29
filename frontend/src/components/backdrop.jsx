import { cn } from '@/lib/utils'

/**
 * A faint wash of the brand colours behind the top of the page. Place it
 * once, as the first child of the page wrapper. It stays low enough in
 * opacity to read as depth rather than glow.
 */
export function Backdrop({ className }) {
  return (
    <div
      data-brand-backdrop=""
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-60 dark:opacity-100',
        'bg-[radial-gradient(48rem_18rem_at_15%_-4rem,rgb(45_232_181/0.10),transparent_70%),radial-gradient(52rem_20rem_at_85%_-6rem,rgb(8_120_249/0.12),transparent_70%)]',
        className
      )}
    />
  );
}
