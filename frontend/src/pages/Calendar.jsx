import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, CircleAlert, X, Zap } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { MetaPill, Panel } from "@/components/page";
import { StatusDot, TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { assigneeId, daysUntilDue, dueDateValue, localDayKey, taskHref } from "@/lib/format";
import { useAllTasks } from "@/lib/use-tasks";
import { cn } from "@/lib/utils";

const SCOPES = [
  { value: "all", label: "Everyone" },
  { value: "mine", label: "Just me" },
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_PILLS = 3;

const monthStart = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/** The weeks shown for a month, Monday first, padded with the days around it. */
function monthGrid(first) {
  const offset = (first.getDay() + 6) % 7;
  const inMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((offset + inMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - offset + i);
    return { date, key: localDayKey(date), inMonth: date.getMonth() === first.getMonth() };
  });
}

/** How a deadline pill is coloured: done, overdue or still open. */
const toneOf = (t, todayKey) =>
  t.status === "done" ? "done" : dueDateValue(t.dueDate) < todayKey ? "overdue" : "open";

const PILL = {
  open: "border-highlight/25 bg-accent text-accent-foreground before:bg-highlight",
  done: "border-status-done/25 bg-status-done/10 text-status-done before:bg-status-done",
  overdue: "border-danger/25 bg-danger/8 text-danger before:bg-danger",
};

export default function Calendar() {
  const { user } = useAuth();
  const { projects } = useOutletContext();
  const tasks = useAllTasks(projects);
  const [month, setMonth] = useState(monthStart);
  const [projectId, setProjectId] = useState("all");
  const [scope, setScope] = useState("all");
  const [selected, setSelected] = useState(null);
  const todayKey = localDayKey();

  // Tasks with a deadline after the filters, grouped by their (UTC) day
  const { byDay, dated } = useMemo(() => {
    const dated = (tasks || []).filter(
      (t) =>
        t.dueDate &&
        (projectId === "all" || t.projectId === projectId) &&
        (scope === "all" || assigneeId(t) === user._id),
    );
    const byDay = {};
    dated.forEach((t) => (byDay[dueDateValue(t.dueDate)] ||= []).push(t));
    Object.values(byDay).forEach((list) => list.sort((a, b) => (a.status === "done") - (b.status === "done")));
    return { byDay, dated };
  }, [tasks, projectId, scope, user._id]);

  const grid = useMemo(() => monthGrid(month), [month]);
  const monthLabel = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const inMonth = grid.filter((c) => c.inMonth).flatMap((c) => byDay[c.key] || []);
  const overdue = dated.filter((t) => t.status !== "done" && daysUntilDue(t.dueDate) < 0);
  const nextWeek = dated
    .filter((t) => t.status !== "done" && daysUntilDue(t.dueDate) >= 0 && daysUntilDue(t.dueDate) <= 6)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const goTo = (d) => {
    setMonth(monthStart(d));
    setSelected(null);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="font-mono text-xs font-medium tracking-wide text-highlight uppercase">Deadlines</p>
          <h1 className="text-[28px] leading-9 font-medium sm:text-[32px] sm:leading-10">Calendar</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="sm:h-9"
          >
            <option value="all">All projects{projects ? ` (${projects.length})` : ""}</option>
            {(projects || []).map(({ project }) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Segmented label="Whose deadlines" options={SCOPES} value={scope} onChange={setScope} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-elevated p-0.5 shadow-[var(--shadow-card)]">
            <IconButton variant="ghost" aria-label="Previous month" className="size-8" onClick={() => goTo(addMonths(month, -1))}>
              <ChevronLeft aria-hidden="true" />
            </IconButton>
            <Button variant="ghost" size="sm" onClick={() => goTo(new Date())}>
              Today
            </Button>
            <IconButton variant="ghost" aria-label="Next month" className="size-8" onClick={() => goTo(addMonths(month, 1))}>
              <ChevronRight aria-hidden="true" />
            </IconButton>
          </div>
          <h2 className="text-lg font-semibold" aria-live="polite">
            {monthLabel}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <Legend tone="open">Open</Legend>
          <Legend tone="done">Done</Legend>
          <Legend tone="overdue">Overdue</Legend>
          <MetaPill>
            {inMonth.length} deadline{inMonth.length === 1 ? "" : "s"} this month
          </MetaPill>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Month grid from md up */}
        <section aria-label={monthLabel} className="surface-card hidden p-3 hover:border-border md:block">
          <div className="grid grid-cols-7 gap-1.5 pb-1.5">
            {WEEKDAYS.map((d) => (
              <p key={d} className="section-label rounded-md bg-secondary py-1.5 text-center">
                {d}
              </p>
            ))}
          </div>
          {tasks === null ? (
            <Skeleton className="h-[560px] w-full rounded-lg" />
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {grid.map(({ date, key, inMonth: own }) => {
                const list = byDay[key] || [];
                const isToday = key === todayKey;
                const extra = list.length - MAX_PILLS;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-h-28 min-w-0 flex-col gap-1 rounded-lg border p-1.5 transition-colors",
                      own ? "border-border bg-elevated" : "border-dashed border-border bg-secondary/40",
                      isToday && "border-highlight ring-1 ring-highlight",
                      selected === key && !isToday && "border-card-edge-hover bg-secondary/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(selected === key ? null : key)}
                      aria-label={`${date.toLocaleDateString(undefined, { dateStyle: "full" })}, ${list.length} deadline${list.length === 1 ? "" : "s"}`}
                      aria-pressed={selected === key}
                      className={cn(
                        "flex w-fit cursor-pointer items-center gap-1.5 rounded-md px-1 text-xs font-medium tabular-nums outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50",
                        own ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className={cn(isToday && "grid size-5 place-items-center rounded-full bg-highlight text-white")}>
                        {date.getDate()}
                      </span>
                      {isToday && <span className="font-mono text-[10px] text-highlight uppercase">Today</span>}
                    </button>
                    {list.slice(0, MAX_PILLS).map((t) => (
                      <Link
                        key={t._id}
                        to={taskHref(t)}
                        title={`${t.title} · ${t.projectName}`}
                        className={cn(
                          "relative block truncate rounded-[4px] border py-0.5 pr-1.5 pl-2.5 text-[11px] leading-4 font-medium outline-none before:absolute before:inset-y-1 before:left-1 before:w-0.5 before:rounded-full hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/50",
                          PILL[toneOf(t, todayKey)],
                          t.status === "done" && "line-through decoration-1",
                        )}
                      >
                        {t.title}
                      </Link>
                    ))}
                    {extra > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelected(key)}
                        className="w-fit cursor-pointer rounded px-1 text-[11px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        +{extra} more
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Agenda list on phones */}
        <section aria-label={`${monthLabel} agenda`} className="space-y-4 md:hidden">
          {tasks === null ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : inMonth.length === 0 ? (
            <p className="surface-card px-4 py-8 text-center text-sm text-muted-foreground">No deadlines in {monthLabel}.</p>
          ) : (
            grid
              .filter((c) => c.inMonth && byDay[c.key]?.length)
              .map(({ date, key }) => (
                <div key={key}>
                  <p className={cn("section-label mb-1.5 px-1", key === todayKey && "text-highlight")}>
                    {date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                    {key === todayKey && " · Today"}
                  </p>
                  <ul className="surface-card divide-y divide-border overflow-hidden">
                    {byDay[key].map((t) => (
                      <li key={t._id}>
                        <TaskRow task={t} showStatus={false} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </section>

        <aside className="flex flex-col gap-6 md:grid md:grid-cols-2 xl:flex">
          {selected && (
            <Panel
              title={new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              icon={CalendarDays}
              action={
                <IconButton variant="ghost" aria-label="Close day" className="size-7" onClick={() => setSelected(null)}>
                  <X aria-hidden="true" />
                </IconButton>
              }
              className="md:col-span-2 xl:col-span-1"
            >
              <DayList tasks={byDay[selected] || []} empty="Nothing is due this day." />
            </Panel>
          )}

          <Panel
            title="Next 7 days"
            icon={Zap}
            action={<MetaPill>{nextWeek.length}</MetaPill>}
          >
            {tasks === null ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <DayList tasks={nextWeek} withDate empty="No open deadlines in the next week." />
            )}
          </Panel>

          {overdue.length > 0 && (
            <Panel title="Overdue" icon={CircleAlert} action={<MetaPill className="text-danger">{overdue.length}</MetaPill>}>
              <DayList tasks={overdue} withDate empty="" />
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

function Legend({ tone, children }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1", PILL[tone])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

/** Compact task rows for the side panels. */
function DayList({ tasks, withDate = false, empty }) {
  if (!tasks.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t._id}>
          <Link
            to={taskHref(t)}
            className="group flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-2.5 transition-colors hover:border-card-edge-hover hover:bg-secondary/80"
          >
            <StatusDot status={t.status} className="mt-1.5" />
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-[13px] font-medium group-hover:text-highlight", t.status === "done" && "text-muted-foreground line-through")}>
                {t.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">{t.projectName}</p>
            </div>
            {withDate && (
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                {new Date(t.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
