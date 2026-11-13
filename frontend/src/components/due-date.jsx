import { useRef } from "react";
import { CalendarClock } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { dueInfo } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE = { overdue: "danger", soon: "brand", later: "default", done: "default" };

/** A task or subtask deadline as a small chip, coloured by how close it is. */
export function DueChip({ date, status, className }) {
  const info = dueInfo(date, status);
  if (!info) return null;
  return (
    <Chip tone={TONE[info.urgency]} title={info.full} className={className}>
      <CalendarClock className="size-3" aria-hidden="true" />
      {info.label}
    </Chip>
  );
}

const TEXT = {
  overdue: "text-danger",
  soon: "text-foreground",
  later: "text-muted-foreground",
  done: "text-muted-foreground",
};

/** A deadline as quiet mono text for list rows, coloured only when it is close or late. */
export function DueText({ date, status, className }) {
  const info = dueInfo(date, status);
  if (!info) return null;
  return (
    <span title={info.full} className={cn("font-mono text-xs whitespace-nowrap tabular-nums", TEXT[info.urgency], className)}>
      {info.label}
    </span>
  );
}

/**
 * A button that opens the browser's date picker. The real <input type="date">
 * sits invisibly under the button so the picker anchors to it; `value` and
 * `onChange` use "YYYY-MM-DD", and "" when the date is cleared.
 */
export function DuePicker({ value, onChange, label, className, children }) {
  const input = useRef(null);
  const open = () => {
    try {
      input.current?.showPicker();
    } catch {
      input.current?.focus();
    }
  };
  return (
    <span className={cn("relative inline-flex", className)}>
      <input
        ref={input}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={open}
        className="relative inline-flex cursor-pointer items-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {children}
      </button>
    </span>
  );
}
