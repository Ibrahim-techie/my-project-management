import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CalendarClock, ChevronDown, CircleAlert, CircleCheck, Clock, Inbox, ListTodo } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { EmptyState, MetaPill, PageTitle } from "@/components/page";
import { SearchField } from "@/components/search-field";
import { TaskRow } from "@/components/task-row";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntilDue } from "@/lib/format";
import { useMyTasks } from "@/lib/use-tasks";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

/* Open tasks fall into these buckets by deadline; done tasks get their own */
const GROUPS = [
  { key: "overdue", label: "Overdue", icon: CircleAlert, tone: "text-danger" },
  { key: "today", label: "Today", icon: Clock, tone: "text-highlight" },
  { key: "week", label: "This week", icon: CalendarClock, tone: "text-subtle-foreground" },
  { key: "later", label: "Later", icon: CalendarClock, tone: "text-subtle-foreground" },
  { key: "none", label: "No due date", icon: Inbox, tone: "text-subtle-foreground" },
  { key: "done", label: "Completed", icon: CircleCheck, tone: "text-status-done" },
];

const groupOf = (t) => {
  if (t.status === "done") return "done";
  const days = daysUntilDue(t.dueDate);
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 6) return "week";
  return "later";
};

export default function MyTasks() {
  const { user } = useAuth();
  const { projects } = useOutletContext();
  const tasks = useMyTasks(projects, user._id);
  const [filter, setFilter] = useState("open");
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(false);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = (tasks || []).filter((t) => {
      if (filter === "open" && t.status === "done") return false;
      if (!["open", "all"].includes(filter) && t.status !== filter) return false;
      return !q || `${t.title} ${t.description || ""} ${t.projectName}`.toLowerCase().includes(q);
    });
    const byGroup = Object.fromEntries(GROUPS.map((g) => [g.key, []]));
    shown.forEach((t) => byGroup[groupOf(t)].push(t));
    // soonest deadline first; undated and done keep most recently updated first
    ["overdue", "today", "week", "later"].forEach((k) =>
      byGroup[k].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    );
    return GROUPS.map((g) => ({ ...g, tasks: byGroup[g.key] })).filter((g) => g.tasks.length);
  }, [tasks, filter, query]);

  const openCount = tasks?.filter((t) => t.status !== "done").length ?? 0;
  const doneCount = (tasks?.length ?? 0) - openCount;
  const total = groups.reduce((n, g) => n + g.tasks.length, 0);

  return (
    <div>
      <PageTitle title="My Tasks" meta={tasks ? `${openCount} open · ${doneCount} done` : null}>
        Everything assigned to <span className="highlight">you</span>, across all your projects.
      </PageTitle>

      <div className="surface-card mt-6 flex flex-col gap-3 p-3 hover:border-border sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          label="Search my tasks"
          placeholder="Search tasks or projects"
          value={query}
          onChange={setQuery}
          className="flex-1 sm:max-w-sm"
        />
        <Segmented label="Filter by status" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-6 space-y-6">
        {tasks === null ? (
          [0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ))
        ) : total === 0 ? (
          <EmptyState
            icon={tasks.length ? ListTodo : CircleCheck}
            title={tasks.length ? "No tasks match" : "Nothing assigned to you"}
          >
            {tasks.length
              ? "Try another status or search."
              : "When someone assigns you a task in any project, it shows up here."}
          </EmptyState>
        ) : (
          groups.map(({ key, label, icon: Icon, tone, tasks: list }) => {
            const collapsible = key === "done" && filter !== "done";
            const open = !collapsible || showDone;
            return (
              <section key={key} aria-labelledby={`group-${key}`}>
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 id={`group-${key}`} className={cn("flex items-center gap-2 text-xs font-semibold tracking-wider uppercase", tone)}>
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                    <MetaPill className="py-0 tracking-normal">{list.length}</MetaPill>
                  </h2>
                  {collapsible && (
                    <button
                      type="button"
                      onClick={() => setShowDone((v) => !v)}
                      aria-expanded={open}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {open ? "Hide" : "Show"}
                      <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {open && (
                  <ul
                    className={cn(
                      "surface-card divide-y divide-border overflow-hidden hover:border-border",
                      key === "overdue" && "border-danger/30 hover:border-danger/30",
                    )}
                  >
                    {list.map((t) => (
                      <li key={t._id}>
                        <TaskRow task={t} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
