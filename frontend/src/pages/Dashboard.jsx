import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  AlarmClock,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleCheck,
  FolderOpen,
  ListChecks,
  ListTodo,
  Plus,
  Users,
} from "lucide-react";
import { useAuth } from "../auth.jsx";
import { EmptyState, Panel } from "@/components/page";
import { PendingInvites } from "@/components/pending-invites";
import { Reveal } from "@/components/reveal";
import { StatusDot, TaskRow } from "@/components/task-row";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, STATUS_LABEL, daysUntilDue, displayName, relativeTime, taskHref } from "@/lib/format";
import { useMyTasks } from "@/lib/use-tasks";
import { cn } from "@/lib/utils";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

const today = () => new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

export default function Dashboard() {
  const { user } = useAuth();
  const { projects, reloadProjects } = useOutletContext();
  const myTasks = useMyTasks(projects, user._id);

  const summary = useMemo(() => {
    const t = myTasks || [];
    const open = t.filter((x) => x.status !== "done");
    const days = (x) => daysUntilDue(x.dueDate);
    return {
      open,
      done: t.length - open.length,
      total: t.length,
      inProgress: open.filter((x) => x.status === "in_progress").length,
      overdue: open.filter((x) => days(x) !== null && days(x) < 0).length,
      dueThisWeek: open.filter((x) => days(x) !== null && days(x) >= 0 && days(x) <= 6).length,
      upcoming: open
        .filter((x) => x.dueDate)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 6),
      openByProject: open.reduce((m, x) => ((m[x.projectId] = (m[x.projectId] || 0) + 1), m), {}),
    };
  }, [myTasks]);

  const loading = myTasks === null;
  const manages = (projects || []).filter((p) => p.role === "admin").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-subtle-foreground">
            <CalendarDays className="size-3.5 text-highlight" aria-hidden="true" />
            {today()}
          </span>
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight sm:text-4xl sm:leading-[44px]">
            {greeting()}, {displayName(user).split(" ")[0]}
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Here is what needs you today, across{" "}
            <span className="highlight">
              {projects ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : "your projects"}
            </span>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="soft" asChild>
            <Link to="/my-tasks">
              <ListChecks className="text-highlight" aria-hidden="true" /> My tasks
            </Link>
          </Button>
          <Button variant="solid" asChild>
            <Link to="/projects?new=1">
              <Plus aria-hidden="true" /> New project
            </Link>
          </Button>
        </div>
      </section>

      <PendingInvites onJoined={reloadProjects} />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Active projects"
          icon={FolderOpen}
          tint="blue"
          value={projects?.length}
          badge={projects && manages > 0 && <Chip tone="brand">{manages} you manage</Chip>}
        />
        <StatCard
          index={1}
          label="Open tasks"
          icon={ListTodo}
          tint="slate"
          value={loading ? null : summary.open.length}
          badge={!loading && summary.inProgress > 0 && <Chip tone="in_progress">{summary.inProgress} in progress</Chip>}
        />
        <StatCard
          index={2}
          label="Due this week"
          icon={AlarmClock}
          tint="amber"
          value={loading ? null : summary.dueThisWeek}
          badge={
            loading ? null : summary.overdue > 0 ? (
              <Chip tone="danger">{summary.overdue} overdue</Chip>
            ) : (
              <Chip tone="success">On track</Chip>
            )
          }
        />
        <StatCard
          index={3}
          label="Completed"
          icon={CircleCheck}
          tint="emerald"
          value={loading ? null : summary.done}
          badge={!loading && summary.total > 0 && <Chip tone="success">{Math.round((summary.done / summary.total) * 100)}%</Chip>}
          progress={summary.total ? { value: summary.done, max: summary.total } : null}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Panel
            title="Your projects"
            icon={FolderOpen}
            action={
              <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-highlight hover:underline">
                View all <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          >
            {projects === null ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No projects yet"
                className="border-dashed shadow-none"
                action={
                  <Button variant="solid" asChild>
                    <Link to="/projects?new=1">Create a project</Link>
                  </Button>
                }
              >
                Create one and invite your team to start planning together.
              </EmptyState>
            ) : (
              <ul className="space-y-2">
                {projects.slice(0, 5).map(({ project, role }, i) => (
                  <Reveal as="li" key={project._id} index={i}>
                    <ProjectRow project={project} role={role} openTasks={summary.openByProject[project._id] || 0} />
                  </Reveal>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Upcoming deadlines"
            icon={AlarmClock}
            action={
              <Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-medium text-highlight hover:underline">
                Calendar <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
            className="pb-2 sm:pb-3"
          >
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : summary.upcoming.length === 0 ? (
              <p className="pb-3 text-sm text-muted-foreground">
                None of your open tasks has a deadline. Set one from a task&apos;s panel.
              </p>
            ) : (
              <ul className="-mx-5 divide-y divide-border sm:-mx-6">
                {summary.upcoming.map((t) => (
                  <li key={t._id}>
                    <TaskRow task={t} showStatus={false} className="sm:px-6" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <Panel
            title="Assigned to you"
            icon={ListChecks}
            action={!loading && summary.total > 0 && <Chip tone="success">{summary.done} of {summary.total} done</Chip>}
          >
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : summary.open.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CircleCheck className="size-7 text-status-done" aria-hidden="true" />
                <p className="mt-2 font-medium">Nothing on your plate</p>
                <p className="mt-0.5 text-sm text-muted-foreground">When someone assigns you a task, it shows up here.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {summary.open.slice(0, 6).map((t) => (
                  <li key={t._id}>
                    <Link
                      to={taskHref(t)}
                      className="group flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-2.5 transition-colors hover:border-card-edge-hover hover:bg-secondary/80"
                    >
                      <StatusDot status={t.status} className="mt-1.5" />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[13px] leading-5 font-medium group-hover:text-highlight">{t.title}</p>
                        <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
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

          <Panel title="Your workload" icon={ListTodo} description="Your tasks by status, across every project.">
            <WorkloadBars tasks={myTasks} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

const TINTS = {
  blue: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
  slate: "border-border bg-secondary text-subtle-foreground",
  amber: "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
};

function StatCard({ index, label, icon: Icon, tint, value, badge, progress }) {
  const still = useReducedMotion();
  return (
    <motion.div
      initial={still ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="surface-card flex flex-col gap-3 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="section-label pt-1.5">{label}</span>
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg border", TINTS[tint])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {value === undefined || value === null ? (
          <Skeleton className="h-9 w-12" />
        ) : (
          <span className="text-3xl leading-9 font-semibold tracking-tight tabular-nums sm:text-4xl sm:leading-10">{value}</span>
        )}
        {badge || null}
      </div>
      {progress && (
        <Progress
          value={progress.value}
          max={progress.max}
          className="h-1 bg-secondary"
          aria-label={`${progress.value} of ${progress.max} of your tasks done`}
        />
      )}
    </motion.div>
  );
}

function ProjectRow({ project, role, openTasks }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="group flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3.5 outline-none transition-colors hover:border-card-edge-hover hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-4"
    >
      <ProjectTile name={project.name} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold group-hover:text-highlight">{project.name}</p>
          <Chip tone={role === "admin" ? "brand" : "default"}>{ROLE_LABEL[role]}</Chip>
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{project.description || "No description yet."}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" aria-hidden="true" />
            {project.members} member{project.members === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <ListTodo className="size-3.5" aria-hidden="true" />
            {openTasks ? `${openTasks} of your tasks open` : "Nothing open for you"}
          </span>
        </div>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-highlight" aria-hidden="true" />
    </Link>
  );
}

/** The first letter of a project in a tinted square, the colour picked from its name. */
export function ProjectTile({ name, className }) {
  const tones = [TINTS.blue, TINTS.emerald, TINTS.amber, "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300"];
  const tone = tones[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % tones.length];
  return (
    <span
      aria-hidden="true"
      className={cn("grid size-10 shrink-0 place-items-center rounded-lg border text-sm font-semibold", tone, className)}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function WorkloadBars({ tasks }) {
  if (tasks === null) return <Skeleton className="h-24 w-full rounded-lg" />;
  const total = tasks.length;
  const rows = [
    { status: "todo", bar: "bg-status-todo" },
    { status: "in_progress", bar: "bg-status-progress" },
    { status: "done", bar: "bg-status-done" },
  ].map((r) => ({ ...r, count: tasks.filter((t) => t.status === r.status).length }));

  if (total === 0) return <p className="text-sm text-muted-foreground">No tasks assigned to you yet.</p>;

  return (
    <ul className="space-y-3">
      {rows.map(({ status, bar, count }) => (
        <li key={status}>
          <div className="mb-1 flex items-center justify-between text-[13px]">
            <span className="font-medium">{STATUS_LABEL[status]}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {count} / {total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${(count / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
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
        <Chip tone={role === "admin" ? "brand" : "default"}>{ROLE_LABEL[role]}</Chip>
      </div>
      <h3 className="mt-4 text-base leading-snug font-semibold group-hover:text-highlight">{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">{project.description || "No description yet."}</p>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          {project.members} member{project.members === 1 ? "" : "s"}
        </span>
        {relativeTime(project.updatedAt) && (
          <span className="font-mono text-[11px]">Updated {relativeTime(project.updatedAt)}</span>
        )}
      </div>
    </Link>
  );
}
