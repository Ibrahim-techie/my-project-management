import { useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/lib/use-hotkey";
import { cn } from "@/lib/utils";

/** A toolbar search box that "/" focuses from anywhere on the page. */
export function SearchField({ value, onChange, label, placeholder = "Search", className }) {
  const ref = useRef(null);
  useHotkey("/", () => ref.current?.focus());

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="search"
        aria-label={label}
        aria-keyshortcuts="/"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && (onChange(""), e.currentTarget.blur())}
        className="peer pr-8 pl-8"
      />
      {!value && (
        <Kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 transition-opacity peer-focus:opacity-0"
        >
          /
        </Kbd>
      )}
    </div>
  );
}
