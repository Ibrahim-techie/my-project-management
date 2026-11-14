import { CircleAlert, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import { Field, TextInput } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HINT = "Lowercase, used when teammates add you";

// A status line under the input. The icon is decorative; the text says it all.
function StatusLine({ icon: Icon, spin = false, className, children }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      <Icon className={cn("size-3.5 shrink-0", spin && "motion-safe:animate-spin")} aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * The sign-up form's username input with live availability (from
 * useUsernameAvailability): a status line under it, and suggestions to pick
 * when the name is taken. It lowercases as you type, which is what
 * registration accepts, and never blocks typing while a check runs.
 */
export function UsernameField({ value, onChange, availability, onPick, inputRef }) {
  const { status, code, message, suggestions } = availability;
  const stillTyping = status === "invalid" && code === "too_short";
  const isError = status === "taken" || (status === "invalid" && !stillTyping);

  let hint = HINT;
  if (stillTyping) hint = message;
  else if (status === "checking") {
    hint = (
      <StatusLine icon={LoaderCircle} spin>
        {message}
      </StatusLine>
    );
  } else if (status === "available") {
    hint = (
      <StatusLine icon={CircleCheck} className="text-status-done">
        {message}
      </StatusLine>
    );
  } else if (status === "error") {
    hint = (
      <StatusLine icon={CircleAlert} className="text-warning">
        {message}
        <button
          type="button"
          onClick={availability.recheck}
          className="cursor-pointer rounded-sm font-medium underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Try again
        </button>
      </StatusLine>
    );
  }

  const error = !isError ? undefined : status === "taken" ? <StatusLine icon={CircleX}>{message}</StatusLine> : message;

  // Results are announced; "checking" isn't, it would chatter at every pause
  const announcement =
    status === "taken"
      ? `${message}.${suggestions.length ? ` Suggestions: ${suggestions.join(", ")}.` : ""}`
      : status === "available" || status === "error" || isError
        ? message
        : "";

  return (
    <div className="space-y-1.5">
      {/* No hint alongside an error: Field would describe the input by a hint it doesn't render */}
      <Field label="Username" hint={isError ? undefined : hint} error={error}>
        <TextInput
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </Field>
      {status === "taken" &&
        (suggestions.length > 0 ? (
          <div role="group" aria-label="Username suggestions" className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Try</span>
            {suggestions.map((s) => (
              <Button
                key={s}
                type="button"
                variant="soft"
                size="sm"
                aria-label={`Use ${s}`}
                onClick={() => onPick(s)}
                className="h-7 px-2 font-mono text-xs pointer-coarse:h-9"
              >
                {s}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Try adding a word or a number.</p>
        ))}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
