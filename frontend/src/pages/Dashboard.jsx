import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, CircleCheck, FolderKanban, ListTodo } from "lucide-react";
import { api, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { EmptyState, SectionTitle } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, STATUS_LABEL, displayName, relativeTime } from "@/lib/format";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function Dashboard() {
  const { user } = useAuth();
  const { projects } = useOutletContext();
  const [myTasks, setMyTasks] = useState(null);
  const still = useReducedMotion();

  useEffect(() => {
    if (!projects) return;
    Promise.all(
      projects.map(({ project }) =>
        api
          .get(`/task/${project._id}/users/${user._id}`)
          .then((res) => (unwrap(res) || []).map((t) => ({ ...t, projectName: project.name })))
          .catch(() => []),
      ),
    ).then((lists) =>
      setMyTasks(lists.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))),
    );
  }, [projects, user._id]);

  const stats = useMemo(() => {
    const t = myTasks || [];
    const done = t.filter((x) => x.status === "done").length;
    return [
      { label: "Projects", value: projects?.length, icon: FolderKanban, tint: "bg-brand-cyan/10 text-brand-cyan" },
      {
        label: "Open tasks",
        value: myTasks && t.length - done,
        icon: ListTodo,
        tint: "bg-status-progress/10 text-status-progress",
      },
      {
        label: "Completed",
        value: myTasks && done,
        icon: CircleCheck,
        tint: "bg-status-done/10 text-status-done",
        progress: t.length ? { value: done, max: t.length } : null,
      },
    ];
  }, [projects, myTasks]);

  const open = (myTasks || []).filter((t) => t.status !== "done");

  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight sm:text-5xl">
          {greeting()}, {displayName(user).split(" ")[0]}
        </h1>
        <p className="max-w-2xl text-base text-subtle-foreground md:text-xl">
          Here is what needs you today, across <span className="highlight">every project you are part of</span>.
        </p>
      </section>

      <section aria-label="Summary" className="grid grid-cols-3 gap-3 sm:gap-6">
        {stats.map(({ label, value, icon: Icon, tint, progress }, i) => (
          <motion.div
            key={label}
            initial={still ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="surface-card p-4 sm:p-6"
          >
            <span className={`grid size-8 place-items-center rounded-lg ${tint}`}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            {value === undefined || value === null ? (
              <Skeleton className="mt-4 h-8 w-12" />
            ) : (
              <p className="mt-4 font-montserrat text-3xl font-semibold tracking-tight sm:text-4xl">{value}</p>
            )}
            <p className="mt-1 text-xs text-subtle-foreground sm:text-sm">{label}</p>
            {progress && (
              <Progress
                value={progress.value}
                max={progress.max}
                className="mt-3"
                aria-label={`${progress.value} of ${progress.max} of your tasks done`}
              />
            )}
          </motion.div>
        ))}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Assigned to you">Open tasks, most recently updated first.</SectionTitle>
        {myTasks === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : open.length === 0 ? (
          <EmptyState icon={CircleCheck} title="Nothing on your plate">
            When someone assigns you a task, it shows up here.
          </EmptyState>
        ) : (
          <ul className="surface-card divide-y divide-border/60 overflow-hidden">
            {open.slice(0, 8).map((t) => (
              <li key={t._id}>
                <Link
                  to={`/projects/${t.project}?task=${t._id}`}
                  className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/60 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.projectName} · updated {relativeTime(t.updatedAt)}
                    </p>
                  </div>
                  <Chip tone={t.status}>{STATUS_LABEL[t.status]}</Chip>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Your projects"
          action={
            <Button variant="muted" asChild>
              <Link to="/projects">
                View all <ArrowUpRight className="-ml-1 size-4" aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        {projects === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            action={
              <Button variant="solid" asChild>
                <Link to="/projects?new=1">Create a project</Link>
              </Button>
            }
          >
            Create one and invite your team to start planning together.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map(({ project, role }) => (
              <ProjectCard key={project._id} project={project} role={role} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function ProjectCard({ project, role }) {
  return (
    <Link
      to={`/projects/${project._id}`}
      className="surface-card group flex flex-col p-5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-lg border border-border font-montserrat text-sm font-semibold"
        >
          {project.name.charAt(0).toUpperCase()}
        </span>
        <Chip tone={role === "admin" ? "brand" : "default"}>{ROLE_LABEL[role]}</Chip>
      </div>
      <h3 className="mt-4 font-montserrat leading-snug font-semibold">{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {project.description || "No description yet."}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {project.members} member{project.members === 1 ? "" : "s"}
        </span>
        <ArrowUpRight className="size-4 transition-colors group-hover:text-brand" aria-hidden="true" />
      </div>
    </Link>
  );
}
