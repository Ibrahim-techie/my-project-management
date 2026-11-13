import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * The top bar search: type to filter your projects, Enter or click to open
 * one. Cmd+K (Ctrl+K elsewhere) focuses it from anywhere.
 */
export function ProjectJump({ projects, className }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const results = (projects || []).filter(({ project }) => project.name.toLowerCase().includes(q)).slice(0, 8);

  const go = (project) => {
    navigate(`/projects/${project._id}`);
    setQuery("");
    setOpen(false);
    ref.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (results.length ? (i + step + results.length) % results.length : 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].project);
    } else if (e.key === "Escape") {
      setQuery("");
      setOpen(false);
      e.currentTarget.blur();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="search"
        role="combobox"
        aria-label="Jump to a project"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        placeholder="Search projects"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="peer h-9 border-border bg-elevated pr-14 pl-9 sm:h-9"
      />
      <Kbd
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 px-1.5 transition-opacity peer-focus:opacity-0"
      >
        {isMac ? "⌘K" : "Ctrl K"}
      </Kbd>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Projects"
          className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-card-edge-hover bg-elevated p-1.5 shadow-[var(--shadow-pop)]"
        >
          {results.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted-foreground">
              {projects?.length ? "No projects match" : "No projects yet"}
            </li>
          ) : (
            results.map(({ project }, i) => (
              <li
                key={project._id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // keep focus in the input so the click lands before blur closes the list
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(project)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                  i === active ? "bg-secondary text-foreground" : "text-subtle-foreground",
                )}
              >
                <FolderOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{project.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
