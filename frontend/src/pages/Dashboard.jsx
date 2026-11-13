import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, FolderOpen, Plus, Users } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { EmptyState, Panel } from "@/components/page";
import { PendingInvites } from "@/components/pending-invites";
import { StatusDot, TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, STATUS_LABEL, daysUntilDue, relativeTime, taskHref } from "@/lib/format";
import { useMyTasks } from "@/lib/use-tasks";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1];

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const quietLink =
  "inline-flex items-center gap-1 rounded-md text-[13px] text-subtle-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-3.5";

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, reloadProjects } = useOutletContext();
  const myTasks = useMyTasks(projects, user._id);
  const still = useReducedMotion();

  const summary = useMemo(() => {
    const t = myTasks || [];
    const open = t.filter((x) => x.status !== "done");
    const days = (x) => daysUntilDue(x.dueDate);
    const dated = open.filter((x) => days(x) !== null).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return {
      open,
      dated,
      done: t.length - open.length,
      total: t.length,
      inProgress: open.filter((x) => x.status === "in_progress").length,
      overdue: dated.filter((x) => days(x) < 0).length,
      dueThisWeek: dated.filter((x) => days(x) >= 0 && days(x) <= 6).length,
      nextTwoWeeks: dated.filter((x) => days(x) >= 0 && days(x) <= ROUTE_END).length,
      upcoming: dated.slice(0, 6),
      openByProject: open.reduce((m, x) => ((m[x.projectId] = (m[x.projectId] || 0) + 1), m), {}),
    };
  }, [myTasks]);

  const loading = myTasks === null;
  const manages = (projects || []).filter((p) => p.role === "admin").length;
  const now = new Date();

  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="space-y-6"
    >
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-[28px] leading-9 font-medium sm:text-[32px] sm:leading-10">
            {now.toLocaleDateString(undefined, { weekday: "long" })}{" "}
            <span className="text-muted-foreground">{now.toLocaleDateString(undefined, { day: "numeric", month: "long" })}</span>
          </h1>
          <p className="min-h-6 text-[15px] leading-6 text-subtle-foreground">
            {projects && !loading && (
              <>
                {plural(summary.open.length, "open task")} across {plural(projects.length, "project")}
                {summary.overdue > 0 && (
                  <>
                    {" · "}
                    <span className="text-danger">{summary.overdue} overdue</span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        {/* The desktop top bar already has New project */}
        <Button variant="solid" asChild className="self-start md:hidden">
          <Link to="/projects?new=1">
            <Plus aria-hidden="true" /> New project
          </Link>
        </Button>
      </section>

      <PendingInvites onJoined={reloadProjects} />

      <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active projects" value={projects?.length} note={projects && `${manages} you manage`} />
        <StatCard
          label="Open tasks"
          value={loading ? null : summary.open.length}
          note={!loading && `${summary.inProgress} in progress`}
        />
        <StatCard
          label="Due this week"
          value={loading ? null : summary.dueThisWeek}
          note={!loading && (summary.overdue > 0 ? `${summary.overdue} overdue` : "None overdue")}
          noteClass={summary.overdue > 0 && "text-danger"}
        />
        <StatCard
          label="Completed"
          value={loading ? null : summary.done}
          note={
            !loading &&
            (summary.total ? `${Math.round((summary.done / summary.total) * 100)}% of ${summary.total} tasks` : "No tasks yet")
          }
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Panel
            title="Upcoming deadlines"
            description={
              !loading &&
              summary.dated.length > 0 &&
              `${summary.nextTwoWeeks} in the next two weeks${summary.overdue ? `, ${summary.overdue} overdue` : ""}`
            }
            action={
              <Link to="/calendar" className={quietLink}>
                Calendar <ArrowRight aria-hidden="true" />
              </Link>
            }
            className="pb-2 sm:pb-2"
          >
            {loading ? (
              <div className="space-y-2 pb-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : summary.dated.length === 0 ? (
              <p className="pb-4 text-sm text-muted-foreground">
                None of your open tasks has a deadline. Set one from a task&apos;s panel.
              </p>
            ) : (
              <>
                <DeadlineRoute tasks={summary.dated} />
                <ul className="-mx-5 divide-y divide-border border-t border-border sm:-mx-6">
                  {summary.upcoming.map((t) => (
                    <li key={t._id}>
                      <TaskRow task={t} showStatus={false} className="px-5 sm:px-6" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel
            title="Your projects"
            action={
              <Link to="/projects" className={quietLink}>
                View all <ArrowRight aria-hidden="true" />
              </Link>
            }
            className="pb-2 sm:pb-2"
          >
            {projects === null ? (
              <div className="space-y-2 pb-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                className="mb-4 border-dashed shadow-none"
                action={
                  <Button variant="solid" asChild>
                    <Link to="/projects?new=1">Create a project</Link>
                  </Button>
                }
              >
                Create one and invite your team to start planning together
              </EmptyState>
            ) : (
              <ul className="-mx-5 divide-y divide-border border-t border-border sm:-mx-6">
                {projects.slice(0, 5).map(({ project, role }) => (
                  <li key={project._id}>
                    <ProjectRow project={project} role={role} openTasks={summary.openByProject[project._id] || 0} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Panel
            title="Assigned to you"
            action={
              !loading &&
              summary.total > 0 && (
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {summary.done} of {summary.total} done
                </span>
              )
            }
            className={cn(summary.open.length <= 6 && "pb-2 sm:pb-2")}
          >
            {loading ? (
              <div className="space-y-2 pb-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : summary.open.length === 0 ? (
              <div className="pb-4">
                <p className="font-medium">Nothing on your plate</p>
                <p className="mt-1 text-sm text-muted-foreground">When someone assigns you a task, it shows up here</p>
              </div>
            ) : (
              <ul className="-mx-5 divide-y divide-border border-t border-border sm:-mx-6">
                {summary.open.slice(0, 6).map((t) => (
                  <li key={t._id}>
                    <Link
                      to={taskHref(t)}
                      className="flex items-start gap-3 px-5 py-3 outline-none transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 sm:px-6"
                    >
                      <StatusDot status={t.status} className="mt-1.5" />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[13px] leading-5 font-medium">{t.title}</p>
                        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                          {t.projectName} · {STATUS_LABEL[t.status]} · {relativeTime(t.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {summary.open.length > 6 && (
              <Button variant="soft" asChild className="w-full">
                <Link to="/my-tasks">See all {summary.open.length} open tasks</Link>
              </Button>
            )}
          </Panel>

          <Panel
            title="Your workload"
            action={
              !loading &&
              summary.total > 0 && (
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{plural(summary.total, "task")}</span>
              )
            }
          >
            <Workload tasks={myTasks} />
          </Panel>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, note, noteClass }) {
  return (
    <div className="surface-card p-5 hover:border-border">
      <p className="text-[13px] leading-5 text-subtle-foreground">{label}</p>
      {value === undefined || value === null ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-2 text-[32px] leading-8 font-medium tabular-nums">{value}</p>
      )}
      <p className={cn("mt-2 h-4 truncate font-mono text-xs leading-4 text-muted-foreground", noteClass)}>{note || null}</p>
    </div>
  );
}

/*
 * The route: the next two weeks as a trail. Days are tick marks on one line,
 * each deadline is a waypoint on its day, overdue ones sit on the dashed
 * stretch behind you, and the leg from today to the next deadline is drawn
 * in the accent. Today is the trail blaze under the line.
 */
const ROUTE_START = -3;
const ROUTE_END = 13;
const LINE = 68; // y of the route line, in px
const STEP = 16; // vertical step between stacked waypoints

function DeadlineRoute({ tasks }) {
  const span = ROUTE_END - ROUTE_START;
  const x = (d) => ((Math.min(Math.max(d, ROUTE_START), ROUTE_END) - ROUTE_START) / span) * 100;

  const byDay = new Map();
  for (const t of tasks) {
    const d = daysUntilDue(t.dueDate);
    if (d > ROUTE_END) continue;
    const key = Math.max(d, ROUTE_START);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(t);
  }
  const next = tasks.find((t) => daysUntilDue(t.dueDate) >= 0);
  const nextDay = next ? daysUntilDue(next.dueDate) : null;
  const showNext = next && nextDay <= ROUTE_END;
  const nextStack = showNext ? Math.min(byDay.get(nextDay).length, 3) : 0;
  const overdue = tasks.filter((t) => daysUntilDue(t.dueDate) < 0).length;
  const ahead = tasks.filter((t) => daysUntilDue(t.dueDate) >= 0 && daysUntilDue(t.dueDate) <= ROUTE_END).length;

  const today = new Date();
  const days = Array.from({ length: span + 1 }, (_, i) => ({
    i,
    d: ROUTE_START + i,
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + ROUTE_START + i),
  }));

  return (
    <div
      role="img"
      aria-label={`${plural(ahead, "deadline")} in the next two weeks${overdue ? `, ${overdue} overdue` : ""}`}
      className="@container px-5 pt-1 pb-4"
    >
      <div className="relative h-27 select-none">
        {/* weekends, shaded like the off days on a planning board */}
        {days
          .filter(({ date, i }) => date.getDay() === 6 || (i === 0 && date.getDay() === 0))
          .map(({ d, date }) => {
            const from = Math.max(d - 0.5, ROUTE_START);
            const to = Math.min(date.getDay() === 6 ? d + 1.5 : d + 0.5, ROUTE_END);
            return (
              <span
                key={`we-${d}`}
                className="absolute bg-foreground/[0.03]"
                style={{ left: `${x(from)}%`, width: `${x(to) - x(from)}%`, top: 24, height: LINE - 24 + 20 }}
              />
            );
          })}
        {/* the stretch behind you, dashed, then the line ahead */}
        <span
          className="absolute left-0 border-t border-dashed border-foreground/30"
          style={{ top: LINE, width: `${x(0)}%` }}
        />
        <span className="absolute right-0 h-px bg-foreground/20" style={{ top: LINE, left: `${x(0)}%` }} />
        {showNext && nextDay > 0 && (
          <span
            className="absolute h-0.5 rounded-full bg-highlight"
            style={{ top: LINE - 0.5, left: `${x(0)}%`, width: `${x(nextDay) - x(0)}%` }}
          />
        )}

        {/* day ticks and labels; Mondays get a longer tick */}
        {days.map(({ d, date, i }) => {
          const isToday = d === 0;
          const label = isToday
            ? "Today"
            : i === 0 || date.getDate() === 1
              ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
              : date.getDate();
          return (
            <span key={d}>
              {isToday ? (
                // the trail blaze
                <span
                  className="absolute h-4 w-1 -translate-x-1/2 rounded-[1px] bg-highlight"
                  style={{ left: `${x(d)}%`, top: LINE + 4 }}
                />
              ) : (
                <span
                  className={cn(
                    "absolute w-px -translate-x-1/2",
                    date.getDay() === 1 ? "h-2 bg-foreground/35" : "h-1 bg-foreground/20",
                  )}
                  style={{ left: `${x(d)}%`, top: LINE + 4 }}
                />
              )}
              <span
                className={cn(
                  "absolute -translate-x-1/2 font-mono text-[11px] leading-4 whitespace-nowrap tabular-nums",
                  isToday ? "font-medium text-foreground" : "text-muted-foreground",
                  // thin the labels out when the panel is narrow, not just the screen
                  !isToday && (i % 2 === 1 || Math.abs(d) === 1) && "@max-xl:hidden",
                )}
                style={{ left: `${x(d)}%`, top: LINE + 24 }}
              >
                {label}
              </span>
            </span>
          );
        })}

        {/* waypoints, stacked upward when a day has several */}
        {[...byDay.entries()].map(([d, list]) =>
          (list.includes(next) ? [next, ...list.filter((t) => t !== next)] : list).slice(0, 3).map((t, k) => (
            <span
              key={t._id}
              title={t.title}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-card",
                t === next
                  ? "size-3.5 bg-highlight"
                  : d < 0
                    ? "size-3 bg-danger"
                    : "size-3 border-[1.5px] border-foreground/60 bg-card",
              )}
              style={{ left: `${x(d)}%`, top: LINE - k * STEP }}
            />
          )),
        )}
        {[...byDay.entries()]
          .filter(([, list]) => list.length > 3)
          .map(([d, list]) => (
            <span
              key={`more-${d}`}
              className="absolute ml-3 font-mono text-[11px] leading-4 text-muted-foreground"
              style={{ left: `${x(d)}%`, top: LINE - 2 * STEP - 8 }}
            >
              +{list.length - 3}
            </span>
          ))}

        {/* the next deadline, named above its waypoint */}
        {showNext && (
          <>
            <span
              className={cn(
                "absolute top-0 flex max-w-[55%] items-baseline gap-2 text-xs leading-4",
                x(nextDay) > 60 && "flex-row-reverse",
              )}
              style={
                x(nextDay) > 60
                  ? { right: `${100 - x(nextDay)}%`, marginRight: -6 }
                  : { left: `${x(nextDay)}%`, marginLeft: -6 }
              }
            >
              <span className="shrink-0 font-mono text-highlight">Next</span>
              <span className="truncate text-foreground">{next.title}</span>
            </span>
            <span
              className="absolute w-px -translate-x-1/2 bg-highlight/40"
              style={{ left: `${x(nextDay)}%`, top: 20, height: LINE - (nextStack - 1) * STEP - 10 - 20 }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project, role, openTasks }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="group flex items-center gap-3 px-5 py-3 outline-none transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 sm:px-6"
    >
      <ProjectTile name={project.name} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate font-medium">{project.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
        </p>
        <p className="truncate text-[13px] text-muted-foreground">{project.description || "No description"}</p>
      </div>
      <div className="hidden shrink-0 text-right font-mono text-xs leading-5 text-muted-foreground tabular-nums sm:block">
        <p className={cn(openTasks > 0 && "text-foreground")} title={`${plural(openTasks, "of your tasks")} open`}>
          {openTasks} for you
        </p>
        <p>{plural(project.members, "member")}</p>
      </div>
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}

/** The first letter of a project on a quiet square. */
export function ProjectTile({ name, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-secondary font-mono text-xs font-medium text-subtle-foreground",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const WORKLOAD = [
  { status: "todo", bar: "bg-status-todo" },
  { status: "in_progress", bar: "bg-status-progress" },
  { status: "done", bar: "bg-status-done" },
];

/** Your tasks by status as one stacked bar, with the counts listed under it. */
function Workload({ tasks }) {
  if (tasks === null) return <Skeleton className="h-24 w-full rounded-lg" />;
  const total = tasks.length;
  if (total === 0) return <p className="text-sm text-muted-foreground">No tasks assigned to you yet</p>;
  const rows = WORKLOAD.map((r) => ({ ...r, count: tasks.filter((t) => t.status === r.status).length }));

  return (
    <div className="space-y-4">
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {rows
          .filter((r) => r.count > 0)
          .map(({ status, bar, count }) => (
            <span key={status} className={bar} style={{ flexGrow: count }} />
          ))}
      </div>
      <ul className="space-y-1">
        {rows.map(({ status, bar, count }) => (
          <li key={status} className="flex h-7 items-center gap-2.5 text-[13px]">
            <span aria-hidden="true" className={cn("size-2 rounded-full", bar)} />
            <span className="flex-1 text-subtle-foreground">{STATUS_LABEL[status]}</span>
            <span className="font-mono text-xs tabular-nums">{count}</span>
            <span className="w-10 text-right font-mono text-xs text-muted-foreground tabular-nums">
              {Math.round((count / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A project in the Projects grid. */
export function ProjectCard({ project, role }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="surface-card group flex h-full flex-col p-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <ProjectTile name={project.name} />
        <span className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
      </div>
      <h3 className="mt-4 text-base leading-6 font-medium">{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{project.description || "No description"}</p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 font-mono text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          {plural(project.members, "member")}
        </span>
        {relativeTime(project.updatedAt) && <span>Updated {relativeTime(project.updatedAt)}</span>}
      </div>
    </Link>
  );
}
