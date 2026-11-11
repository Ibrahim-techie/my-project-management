import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { DueChip } from "@/components/due-date";
import { Chip } from "@/components/ui/chip";
import { STATUS_LABEL, taskHref } from "@/lib/format";
import { cn } from "@/lib/utils";

const DOT = { todo: "bg-status-todo", in_progress: "bg-status-progress", done: "bg-status-done" };

/** A small round marker in a task status colour. */
export function StatusDot({ status, className }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", DOT[status] || DOT.todo, className)} />;
}

/** A project name as the mono tag the Stitch lists use. */
export function ProjectTag({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-40 items-center truncate rounded-[4px] border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-medium text-subtle-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * One task in a cross-project list: status dot, title, project tag, the
 * deadline and status on the right. The whole row links to the task.
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
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium group-hover:text-highlight", done && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          {task.projectName && <ProjectTag>{task.projectName}</ProjectTag>}
          <DueChip date={task.dueDate} status={task.status} className="sm:hidden" />
        </div>
      </div>
      <DueChip date={task.dueDate} status={task.status} className="hidden sm:inline-flex" />
      {showStatus && (
        <Chip tone={task.status} className="hidden sm:inline-flex">
          {STATUS_LABEL[task.status]}
        </Chip>
      )}
      <ArrowRight
        className="size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-highlight"
        aria-hidden="true"
      />
    </Link>
  );
}
