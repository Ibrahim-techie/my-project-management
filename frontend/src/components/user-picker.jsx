import { useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { api, unwrap } from "../api";
import { UserAvatar } from "@/components/user-avatar";
import { Spinner } from "@/components/ui/spinner";
import { displayName } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_NOTE = { member: "Already a member", invited: "Invite pending" };

/**
 * Search verified users by username and pick one. A combobox: arrow keys move
 * through results, Enter picks, Escape closes. Members and people with a
 * pending invite are listed but cannot be picked.
 */
export function UserPicker({ projectId, value, onChange, id, ...aria }) {
  const listId = useId();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const q = query.trim().replace(/^@/, "");
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(() => {
      api
        .get("/users/search", { params: { q, projectId } })
        .then((res) => {
          if (cancelled) return;
          const list = unwrap(res) || [];
          setResults(list);
          setActive(list.findIndex((u) => !u.status));
        })
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, projectId]);

  const pick = (user) => {
    if (!user || user.status) return;
    onChange(user);
    setOpen(false);
    setQuery("");
  };

  const move = (dir) => {
    if (!results.length) return;
    let i = active;
    for (let n = 0; n < results.length; n++) {
      i = (i + dir + results.length) % results.length;
      if (!results[i].status) break;
    }
    setActive(i);
  };

  if (value) {
    return (
      <div className="flex h-10 items-center gap-2.5 rounded-lg border border-brand-teal/40 bg-accent px-2.5">
        <UserAvatar user={value} className="size-6" />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium">{displayName(value)}</span>{" "}
          <span className="text-muted-foreground">@{value.userName}</span>
        </span>
        <button
          type="button"
          aria-label={`Clear ${value.userName}`}
          onClick={() => {
            onChange(null);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="grid size-6 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const showList = open && query.trim().replace(/^@/, "").length >= 2;

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        {...aria}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Search by username"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Enter" && showList) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-10 w-full rounded-lg border border-border bg-input-bg pr-9 pl-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-card-edge-hover focus-visible:border-primary/70 focus-visible:ring-[3px] focus-visible:ring-ring/25"
      />
      {loading && <Spinner label="Searching" className="absolute top-1/2 right-3 -translate-y-1/2" />}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching users"
          className="absolute top-full left-0 z-30 mt-1.5 max-h-72 w-full min-w-72 overflow-y-auto rounded-xl border border-border bg-elevated p-1.5 shadow-lg shadow-black/20"
        >
          {!loading && results.length === 0 && (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              No verified user starts with &ldquo;{query.trim().replace(/^@/, "")}&rdquo;
            </li>
          )}
          {results.map((u, i) => (
            <li
              key={u._id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              aria-disabled={!!u.status}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => !u.status && setActive(i)}
              onClick={() => pick(u)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm",
                u.status ? "cursor-not-allowed opacity-55" : "cursor-pointer",
                i === active && !u.status && "bg-accent",
              )}
            >
              <UserAvatar user={u} className="size-7" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{displayName(u)}</span>
                <span className="block truncate text-xs text-muted-foreground">@{u.userName}</span>
              </span>
              {u.status && <span className="shrink-0 text-xs text-muted-foreground">{STATUS_NOTE[u.status]}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
