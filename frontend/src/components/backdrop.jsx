import { cn } from '@/lib/utils'

/**
 * The ChaiUI hexagon glow, hue-shifted from its warm brown to the brand's
 * teal and cyan, with a faint brand wash behind it. Place it once, as the
 * first child of the page wrapper.
 *
 * - Dark mode rotates the hue; light mode inverts first, then rotates, so the
 *   tint stays teal instead of turning purple.
 * - The bottom is masked out so no edge shows where the image stops.
 */
export function Backdrop({ className }) {
  return (
    <>
      <img
        data-chai-backdrop=""
        src="/chaiui/background.svg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className={cn(
          'pointer-events-none absolute top-0 left-1/2 -z-10 w-[2842px] max-w-none -translate-x-1/2 select-none',
          '[mask-image:linear-gradient(to_bottom,#000_50%,transparent)]',
          'opacity-70 [filter:invert(1)_hue-rotate(335deg)_saturate(0.9)] dark:opacity-100 dark:[filter:hue-rotate(160deg)_saturate(1.15)]',
          className
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(48rem_18rem_at_15%_-4rem,rgb(45_232_181/0.08),transparent_70%),radial-gradient(52rem_20rem_at_85%_-6rem,rgb(8_120_249/0.10),transparent_70%)]"
      />
    </>
  );
}
