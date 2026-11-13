import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReducedMotion } from "motion/react";
import { EllipsisVertical, Paperclip, Plus } from "lucide-react";
import { api, errMsg, STATUSES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { useProjectEvents } from "../socket.jsx";
import TaskPanel from "./TaskPanel.jsx";
import { UserAvatar } from "@/components/user-avatar";
import { DueChip } from "@/components/due-date";
import { StatusDot } from "@/components/task-row";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { SearchField } from "@/components/search-field";
import { Kbd } from "@/components/ui/kbd";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { STATUS_LABEL, assigneeId, assigneeOf, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useHotkey } from "@/lib/use-hotkey";

const SCOPES = [
  { value: "all", label: "Everyone" },
  { value: "mine", label: "Assigned to me" },
];

export default function TaskBoard({ projectId, members, canManage }) {
  const { user } = useAuth();
  const toast = useToast();
  const still = useReducedMotion();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");
  const [scope, setScope] = useState("all");
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(null);
  const [activeCol, setActiveCol] = useState(STATUSES[0].value);
  const [params, setParams] = useSearchParams();
  const openTask = params.get("task"); // a task id or "new"
  const scroller = useRef(null);
  const columns = useRef({});

  const setOpenTask = (id) => setParams(id ? { task: id } : {}, { replace: true });
  useHotkey("n", () => setOpenTask("new"), { enabled: canManage && !openTask });

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

  // Live updates from other people. Refetch rather than patch locally: socket
  // payloads carry the raw assignee id, the list needs the populated user.
  useProjectEvents(projectId, {
    "task:created": load,
    "task:updated": load,
    "task:deleted": ({ taskId }) => {
      setTasks((ts) => ts?.filter((t) => t._id !== String(taskId)) ?? ts);
      if (openTask === String(taskId)) setOpenTask(null);
    },
  });

  // Below lg the columns scroll sideways; track which one is in view so the
  // column switcher can show it
  useEffect(() => {
    const root = scroller.current;
    if (!root || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActiveCol(best.target.dataset.status);
      },
      { root, threshold: [0.6, 0.9] },
    );
    Object.values(columns.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const showColumn = (status) => {
    setActiveCol(status);
    columns.current[status]?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "nearest", inline: "start" });
  };

  const move = async (taskId, status, { announce = false } = {}) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === status) return;
    setTasks((ts) => ts.map((t) => (t._id === taskId ? { ...t, status } : t)));
    try {
      await api.patch(`/task/${projectId}/tasks/${taskId}`, { status });
      if (announce) toast(`Moved to ${STATUS_LABEL[status].toLowerCase()}`);
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
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s.value, visible.filter((t) => t.status === s.value)]));

  return (
    <div className="min-w-0">
      {/* Up to lg: search and New task share a row, the filter fills the
          next. From lg up everything sits on one line, New task on the right. */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          label="Search tasks"
          placeholder="Filter tasks"
          value={query}
          onChange={setQuery}
          className="min-w-0 flex-1 lg:max-w-64"
        />
        {canManage && (
          <Button
            variant="solid"
            aria-keyshortcuts="n"
            title="New task (N)"
            onClick={() => setOpenTask("new")}
            className="lg:order-last lg:ml-auto"
          >
            <Plus className="size-4" aria-hidden="true" /> New task
            <Kbd
              aria-hidden="true"
              className="ml-0.5 hidden border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground/70 lg:inline-flex"
            >
              N
            </Kbd>
          </Button>
        )}
        <Segmented
          label="Whose tasks"
          options={SCOPES}
          value={scope}
          onChange={setScope}
          className="w-full [&>button]:flex-1 lg:w-fit lg:[&>button]:flex-none"
        />
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Below lg the columns scroll sideways; this jumps between them */}
      <Segmented
        label="Board columns"
        value={activeCol}
        onChange={showColumn}
        options={STATUSES.map((s) => ({
          value: s.value,
          label: (
            <>
              <StatusDot status={s.value} />
              {s.label}
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{byStatus[s.value].length}</span>
            </>
          ),
        }))}
        className="mt-4 w-full [&>button]:flex-1 lg:hidden"
      />

      <div
        ref={scroller}
        className={cn(
          // full bleed on small screens so a column can peek in from the edge
          "-mx-4 mt-3 flex snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6",
          "lg:mx-0 lg:mt-4 lg:grid lg:grid-cols-3 lg:items-stretch lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0",
        )}
      >
        {STATUSES.map((col) => {
          const colTasks = byStatus[col.value];
          return (
            <section
              key={col.value}
              ref={(el) => (columns.current[col.value] = el)}
              data-status={col.value}
              aria-label={`${col.label}, ${colTasks.length} task${colTasks.length === 1 ? "" : "s"}`}
              className={cn(
                "w-[min(85%,20rem)] min-w-0 shrink-0 snap-start rounded-2xl border border-border bg-secondary/50 p-3 transition-colors lg:w-auto",
                dragOver === col.value && "border-dashed border-highlight/60 bg-accent",
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
              <header className="mb-2 flex h-8 items-center justify-between gap-2 pl-1 pointer-coarse:h-10">
                <h3 className="flex min-w-0 items-center gap-2 text-[13px] font-medium">
                  <StatusDot status={col.value} />
                  <span className="truncate">{col.label}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{colTasks.length}</span>
                </h3>
                {canManage && col.value === "todo" && (
                  <IconButton
                    variant="ghost"
                    aria-label="New task"
                    title="New task"
                    onClick={() => setOpenTask("new")}
                    className="size-8 pointer-coarse:size-10"
                  >
                    <Plus aria-hidden="true" />
                  </IconButton>
                )}
              </header>

              <div className="min-h-32 space-y-2">
                {tasks === null ? (
                  <>
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </>
                ) : colTasks.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-input px-3 py-6 text-center text-[13px] text-muted-foreground">
                    {col.value === "done" ? "Finished work lands here" : "No tasks"}
                  </p>
                ) : (
                  colTasks.map((t) => (
                    <TaskCard
                      key={t._id}
                      task={t}
                      canManage={canManage}
                      onOpen={() => setOpenTask(t._id)}
                      onMove={(status) => move(t._id, status, { announce: true })}
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

/**
 * A task on the board. The title is the button that opens it, stretched over
 * the whole card; managers also get a "Move to" menu, which is how tasks move
 * on touch screens, where dragging is not available.
 */
function TaskCard({ task, canManage, onOpen, onMove }) {
  const assignee = assigneeOf(task);
  const done = task.status === "done";
  return (
    <article
      draggable={canManage}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task._id)}
      className={cn(
        "surface-card group/card relative min-w-0 p-3.5 hover:shadow-[var(--shadow-pop)]",
        canManage && "active:cursor-grabbing",
      )}
    >
      <div className="flex items-start gap-2">
        <h4 className="min-w-0 flex-1 text-sm leading-5 font-medium [overflow-wrap:anywhere]">
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              "cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
        </h4>
        {canManage && <MoveMenu task={task} onMove={onMove} />}
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-muted-foreground [overflow-wrap:anywhere]">
          {task.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {task.attachments?.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3" aria-hidden="true" />
              {task.attachments.length}
              <span className="sr-only">attachments</span>
            </span>
          )}
          {task.dueDate ? <DueChip date={task.dueDate} status={task.status} /> : <span>{relativeTime(task.updatedAt)}</span>}
        </span>
        {assignee && <UserAvatar user={assignee} className="size-6 shrink-0" />}
      </div>
    </article>
  );
}

/** Move a task to another column without dragging it. */
function MoveMenu({ task, onMove }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          variant="ghost"
          aria-label={`Move “${task.title}”`}
          title="Move to"
          className={cn(
            "relative z-10 -mt-1.5 -mr-2 size-8 text-muted-foreground",
            // quiet until wanted with a mouse; always there on touch screens
            "opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:size-10 pointer-coarse:opacity-100",
          )}
        >
          <EllipsisVertical aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {STATUSES.filter((s) => s.value !== task.status).map((s) => (
          <DropdownMenuItem key={s.value} onSelect={() => onMove(s.value)}>
            <StatusDot status={s.value} /> {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
