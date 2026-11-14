import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * The CAMP app icon: a navy tile with a C wrapped around three task
 * columns. The same file is the favicon. Pass `alt=""` when the mark sits
 * next to a label that already names CAMP.
 */
export function BrandMark({ className, alt = "CAMP" }) {
  return (
    <img
      src="/brand/camp-mark.svg"
      alt={alt}
      width="32"
      height="32"
      draggable={false}
      className={cn(
        "size-8 shrink-0 rounded-[22%] shadow-[var(--shadow-card)] select-none",
        className,
      )}
    />
  );
}

// The CAMP letters as outlines, so they look the same everywhere
const WORDMARK =
  "M91.6 36A46.5 50 0 1 0 91.6 64H71.4A27.2 31.5 0 1 1 71.4 36Z" +
  "M95.4 98.4 131.2 2.1H149.9L185.7 98.4H166.4L159.1 78.6H122L114.7 98.4Z" +
  "M140.55 28.9 128.6 60.9H152.5Z" +
  "M195.5 98.4V2.1H213.9L245.1 70 276.3 2.1H294.7V98.4H276.2V42.6L250.6 98.4H239.6L214 42.6V98.4Z" +
  "M314.8 98.4V2.1H352.3A32.5 32.5 0 0 1 352.3 67.1H334.2V98.4Z" +
  "M334.2 20.6V48.6H352.3A14 14 0 0 0 352.3 20.6Z";

/**
 * The CAMP wordmark. It takes the text colour: navy on light backgrounds,
 * white on dark ones. Decorative, so give the surrounding link or heading
 * the accessible name.
 */
export function BrandWordmark({ className }) {
  return (
    <svg
      viewBox="0 0 385 100"
      width="385"
      height="100"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={cn("h-[11px] w-auto shrink-0", className)}
    >
      <path fillRule="evenodd" d={WORDMARK} />
    </svg>
  );
}

/** The mark with the CAMP wordmark, linking home. */
export function Brand({ to = "/", className }) {
  return (
    <Link
      to={to}
      aria-label="CAMP home"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <BrandMark alt="" />
      <BrandWordmark />
    </Link>
  );
}
