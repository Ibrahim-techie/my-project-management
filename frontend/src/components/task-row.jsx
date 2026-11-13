import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DueText } from "@/components/due-date";
import { Chip } from "@/components/ui/chip";
import { STATUS_LABEL, taskHref } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOT = { todo: "bg-status-todo", in_progress: "bg-status-progress", done: "bg-status-done" };

/** A small round marker in a task status colour. */
export function StatusDot({ status, className }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", DOT[status] || DOT.todo, className)} />;
}

/** A project name as quiet text beside a task. */
export function ProjectTag({ children, className }) {
  return <span className={cn("truncate text-[13px] text-muted-foreground", className)}>{children}</span>;
}

/**
 * One task in a cross-project list: status dot, title, project, then the
 * deadline and status on the right. One line from `sm` up, two on phones.
 * The whole row links to the task.
 */
export function TaskRow({ task, showStatus = true, className }) {
  const done = task.status === "done";
  return (
    <Link
      to={taskHref(task)}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-secondary/60 focus-visible:bg-secondary/60 sm:px-5",
        className,
      )}
    >
      <StatusDot status={task.status} />
      <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
        <p className={cn("truncate font-medium sm:min-w-0 sm:flex-1", done && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <div className="mt-0.5 flex min-w-0 items-baseline gap-2 sm:mt-0 sm:w-40 sm:shrink-0">
          {task.projectName && <ProjectTag>{task.projectName}</ProjectTag>}
          <DueText date={task.dueDate} status={task.status} className="ml-auto sm:hidden" />
        </div>
      </div>
      <DueText date={task.dueDate} status={task.status} className="hidden w-36 shrink-0 text-right sm:inline" />
      {showStatus && (
        <Chip tone={task.status} className="hidden sm:inline-flex">
          {STATUS_LABEL[task.status]}
        </Chip>
      )}
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden="true"
      />
    </Link>
  );
}
