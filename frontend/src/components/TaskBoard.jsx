import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Paperclip, Plus, Search } from "lucide-react";
import { api, errMsg, STATUSES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import TaskPanel from "./TaskPanel.jsx";
import { UserAvatar } from "@/components/user-avatar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { assigneeId, assigneeOf, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const SCOPES = [
  { value: "all", label: "Everyone" },
  { value: "mine", label: "Assigned to me" },
];

export default function TaskBoard({ projectId, members, canManage }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("all");
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(null);
  const [params, setParams] = useSearchParams();
  const openTask = params.get("task"); // a task id or "new"

  const setOpenTask = (id) => setParams(id ? { task: id } : {}, { replace: true });

  const load = useCallback(
    () =>
      api
        .get(`/task/${projectId}`)
        .then((res) => setTasks(unwrap(res) || []))
        .catch((e) => setError(errMsg(e))),
    [projectId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const move = async (taskId, status) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === status) return;
    setTasks((ts) => ts.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await api.patch(`/task/${projectId}/tasks/${taskId}`, { status });
    } catch (e) {
      setError(errMsg(e));
      load();
    }
  };

  const q = query.trim().toLowerCase();
  const visible = (tasks || []).filter(
    (t) =>
      (scope === "all" || assigneeId(t) === user._id) &&
      (!q || `${t.title} ${t.description || ""}`.toLowerCase().includes(q)),
  );

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented label="Whose tasks" options={SCOPES} value={scope} onChange={setScope} className="self-start" />
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-56 lg:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search tasks"
              placeholder="Search tasks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {canManage && (
            <Button variant="solid" iconRight={<Plus className="size-4" />} onClick={() => setOpenTask("new")}>
              New task
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Columns sit side by side on desktop and swipe one at a time on phones */}
      <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
        {STATUSES.map((col) => {
          const colTasks = visible.filter((t) => t.status === col.value);
          return (
            <section
              key={col.value}
              aria-label={col.label}
              className={cn(
                "w-[84%] shrink-0 snap-center rounded-xl border border-dashed border-transparent p-1 transition-colors sm:w-[60%] md:w-auto",
                dragOver === col.value && "border-brand-teal/60 bg-accent",
              )}
              onDragOver={(e) => {
                if (!canManage) return;
                e.preventDefault();
                setDragOver(col.value);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                setDragOver(null);
                move(e.dataTransfer.getData("text/plain"), col.value);
              }}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 rounded-full",
                      col.value === "todo" && "bg-status-todo",
                      col.value === "in_progress" && "bg-status-progress",
                      col.value === "done" && "bg-status-done",
                    )}
                  />
                  {col.label}
                </h3>
                <span className="font-montserrat text-xs text-muted-foreground">{colTasks.length}</span>
              </header>

              <div className="min-h-32 space-y-2.5">
                {tasks === null ? (
                  <>
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </>
                ) : colTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    {col.value === "done" ? "Finished work lands here" : "No tasks"}
                  </p>
                ) : (
                  colTasks.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      draggable={canManage}
                      onOpen={() => setOpenTask(t._id)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <TaskPanel
        projectId={projectId}
        taskId={openTask}
        members={members}
        canManage={canManage}
        onClose={() => setOpenTask(null)}
        onChanged={load}
        onCreated={(id) => setOpenTask(id)}
      />
    </div>
  );
}

function TaskCard({ task, draggable, onOpen }) {
  const assignee = assigneeOf(task);
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task._id)}
      onClick={onOpen}
      className={cn(
        "surface-card block w-full cursor-pointer p-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        draggable && "active:cursor-grabbing",
      )}
    >
      <p className={cn("font-montserrat text-sm leading-snug font-semibold", task.status === "done" && "text-muted-foreground line-through")}>
        {task.title}
      </p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {task.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip className="size-3" aria-hidden="true" />
              {task.attachments.length}
              <span className="sr-only">attachments</span>
            </span>
          )}
          <span>{relativeTime(task.updatedAt)}</span>
        </span>
        {assignee && <UserAvatar user={assignee} className="size-6" />}
      </div>
    </button>
  );
}
