import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Paperclip, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { api, errMsg, STATUSES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { UserAvatar } from "@/components/user-avatar";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { STATUS_LABEL, assigneeId, assigneeOf, displayName, shortDate } from "@/lib/format";

const IMAGE_TYPES = ".jpg,.jpeg,.png,.webp";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * The slide-over for one task. `taskId` is a task id, "new" for the create
 * form, or null when closed.
 */
export default function TaskPanel({ projectId, taskId, members, canManage, onClose, onChanged, onCreated }) {
  const isNew = taskId === "new";
  const [task, setTask] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const t = unwrap(await api.get(`/task/${projectId}/tasks/${taskId}`));
    setTask(t);
  }, [projectId, taskId]);

  useEffect(() => {
    setTask(null);
    setError("");
    setEditing(isNew);
    if (taskId && !isNew) load().catch((e) => setError(errMsg(e)));
  }, [taskId, isNew, load]);

  const title = isNew ? "New task" : editing ? "Edit task" : task?.title || "Task";

  return (
    <Drawer open={!!taskId} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent side="right" title={title} className="w-full sm:w-[min(34rem,100vw)]">
        {error && <Alert tone="danger">{error}</Alert>}
        {editing ? (
          <TaskForm
            projectId={projectId}
            task={isNew ? null : task}
            members={members}
            onCancel={isNew ? onClose : () => setEditing(false)}
            onSaved={async (saved) => {
              onChanged();
              if (isNew) onCreated(saved._id);
              else {
                setEditing(false);
                await load();
              }
            }}
          />
        ) : !task ? (
          !error && (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )
        ) : (
          <TaskDetails
            projectId={projectId}
            task={task}
            canManage={canManage}
            onEdit={() => setEditing(true)}
            onChanged={async () => {
              await load();
              onChanged();
            }}
            onDeleted={() => {
              onChanged();
              onClose();
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function TaskDetails({ projectId, task, canManage, onEdit, onChanged, onDeleted }) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const assignee = assigneeOf(task);

  const setStatus = async (status) => {
    try {
      await api.patch(`/task/${projectId}/tasks/${task._id}`, { status });
      await onChanged();
      toast(`Moved to ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/task/${projectId}/tasks/${task._id}`);
      toast("Task deleted");
      onDeleted();
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
      setBusy(false);
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Status</p>
        {canManage ? (
          <Segmented
            label="Task status"
            options={STATUSES}
            value={task.status}
            onChange={setStatus}
          />
        ) : (
          <Chip tone={task.status} className="text-xs">{STATUS_LABEL[task.status]}</Chip>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Assignee</dt>
          <dd className="mt-1.5 flex items-center gap-2">
            {assignee ? (
              <>
                <UserAvatar user={assignee} className="size-6" />
                <span className="truncate">{displayName(assignee)}</span>
              </>
            ) : (
              "Unassigned"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Created</dt>
          <dd className="mt-1.5">{shortDate(task.createdAt)}</dd>
        </div>
      </dl>

      <div>
        <p className="mb-1.5 text-xs text-muted-foreground">Description</p>
        {task.description ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No description.</p>
        )}
      </div>

      {task.attachments?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3" aria-hidden="true" /> Attachments
          </p>
          <ul className="grid grid-cols-3 gap-2">
            {task.attachments.map((a, i) => (
              <li key={a._id || i}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={a.url}
                    alt={`Attachment ${i + 1}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Subtasks projectId={projectId} taskId={task._id} canManage={canManage} />

      {/* Confirm inline: a second modal on top of the drawer would sit outside its
          focus trap and pointer lock, so its clicks would land on the panel below */}
      {canManage &&
        (deleting ? (
          <div
            role="alertdialog"
            aria-labelledby="delete-task-title"
            aria-describedby="delete-task-body"
            className="mt-auto rounded-xl border border-danger/35 bg-danger/8 p-4"
          >
            <p id="delete-task-title" className="flex items-center gap-2 font-montserrat font-semibold">
              <TriangleAlert className="size-4 text-danger" aria-hidden="true" /> Delete this task?
            </p>
            <p id="delete-task-body" className="mt-1 text-sm text-subtle-foreground">
              &ldquo;{task.title}&rdquo; and its subtasks will be removed from the board. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" autoFocus onClick={() => setDeleting(false)} disabled={busy}>
                Keep it
              </Button>
              <Button variant="danger" onClick={remove} disabled={busy}>
                {busy ? "Deleting" : "Delete task"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-4">
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => setDeleting(true)}
            >
              <Trash2 aria-hidden="true" /> Delete
            </Button>
            <Button onClick={onEdit}>
              <Pencil aria-hidden="true" /> Edit task
            </Button>
          </div>
        ))}
    </div>
  );
}

function Subtasks({ projectId, taskId, canManage }) {
  const base = `/task/${projectId}/tasks/${taskId}/subtasks`;
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [title, setTitle] = useState("");

  const load = useCallback(() => api.get(base).then((res) => setItems(unwrap(res) || [])), [base]);

  useEffect(() => {
    load().catch(() => setItems([]));
  }, [load]);

  const run = async (fn) => {
    try {
      await fn();
      await load();
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
    }
  };

  const done = (items || []).filter((s) => s.status === "done").length;
  const total = items?.length || 0;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Subtasks</p>
        {total > 0 && (
          <p className="font-montserrat text-xs text-muted-foreground">
            {done}/{total}
          </p>
        )}
      </div>
      {total > 0 && <Progress value={done} max={total} className="mb-3" aria-label="Subtasks done" />}

      {items === null ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <ul className="space-y-0.5">
          {items.map((s) => {
            const checked = s.status === "done";
            return (
              <li key={s._id} className="group flex items-center gap-3 rounded-md px-1.5 py-1.5 hover:bg-secondary/60">
                <Checkbox
                  id={`sub-${s._id}`}
                  checked={checked}
                  // members may only mark subtasks done, not reopen them
                  disabled={!canManage && checked}
                  onCheckedChange={(v) => run(() => api.patch(`${base}/${s._id}/status`, { status: v ? "done" : "todo" }))}
                />
                <label
                  htmlFor={`sub-${s._id}`}
                  className={`flex-1 cursor-pointer text-sm ${checked ? "text-muted-foreground line-through" : ""}`}
                >
                  {s.title}
                </label>
                {canManage && (
                  <button
                    type="button"
                    aria-label={`Delete subtask ${s.title}`}
                    onClick={() => run(() => api.delete(`${base}/${s._id}`))}
                    className="grid size-6 cursor-pointer place-items-center rounded text-muted-foreground opacity-100 transition-opacity hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canManage && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            run(async () => {
              await api.post(base, { title: title.trim() });
              setTitle("");
            });
          }}
        >
          <Input aria-label="New subtask" placeholder="Add a subtask" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit" variant="muted" size="icon" aria-label="Add subtask" disabled={!title.trim()}>
            <Plus aria-hidden="true" />
          </Button>
        </form>
      )}
    </section>
  );
}

function TaskForm({ projectId, task, members, onCancel, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => ({
    title: task?.title || "",
    description: task?.description || "",
    assignedTo: task ? assigneeId(task) : user._id,
    status: task?.status || "todo",
  }));
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickFiles = (list) => {
    const picked = [...list];
    const tooBig = picked.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setError(`${tooBig.name} is over 5 MB.`);
      return;
    }
    setError("");
    setFiles((cur) => [...cur, ...picked].slice(0, 10));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    files.forEach((f) => fd.append("attachments", f));
    try {
      const res = task
        ? await api.patch(`/task/${projectId}/tasks/${task._id}`, fd)
        : await api.post(`/task/${projectId}`, fd);
      toast(task ? "Task updated" : "Task created", { tone: "success" });
      await onSaved(unwrap(res));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Title">
        <Input value={form.title} onChange={set("title")} required autoFocus />
      </Field>
      <Field label="Description" aside="Optional">
        <Textarea rows={4} value={form.description} onChange={set("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Assignee">
          <Select value={form.assignedTo} onChange={set("assignedTo")} wrapperClassName="w-full">
            {members.map((m) => (
              <option key={m.user._id} value={m.user._id}>
                {displayName(m.user)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set("status")} wrapperClassName="w-full">
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium">Images</p>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-brand-teal/50 hover:bg-accent">
          <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm">Add images</span>
          <span className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB each</span>
          <input
            type="file"
            multiple
            accept={IMAGE_TYPES}
            className="sr-only"
            onChange={(e) => {
              pickFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {task?.attachments?.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            New images are added next to the {task.attachments.length} already attached.
          </p>
        )}
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="solid" disabled={busy || !form.title.trim()}>
          {busy ? "Saving" : task ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
