import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** The Project Camp app icon on its own, for tight spots. */
export function BrandMark({ className }) {
  return (
    <img
      src="/brand/logo-96.png"
      srcSet="/brand/logo-96.png 1x, /brand/logo-192.png 2x"
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-[9px]", className)}
    />
  );
}

/** The app icon with the Project Camp wordmark, linking home. */
export function Brand({ to = "/", className }) {
  return (
    <Link
      to={to}
      aria-label="Project Camp home"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <BrandMark />
      <span className="font-montserrat text-[17px] font-semibold tracking-tight">Project Camp</span>
    </Link>
  );
}
