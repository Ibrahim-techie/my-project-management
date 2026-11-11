import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** The CAMP mark on its own: a navy square with a white C. */
export function BrandMark({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-[15px] leading-none font-semibold text-primary-foreground shadow-[var(--shadow-card)] select-none dark:bg-foreground dark:text-background",
        className,
      )}
    >
      C
    </span>
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
      <BrandMark />
      <span className="text-lg font-semibold tracking-tight">CAMP</span>
    </Link>
  );
}
