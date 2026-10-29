import { useEffect, useState } from "react";
import { api, errMsg, STATUSES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { Alert, Field, Modal } from "./ui.jsx";

const firstOf = (v) => (Array.isArray(v) ? v[0] : v);

export default function TaskModal({ projectId, taskId, members, canManage, onClose, onChanged }) {
  const { user } = useAuth();
  const isNew = !taskId;
  const [task, setTask] = useState(null);
  const [editing, setEditing] = useState(isNew);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: user._id, status: "todo" });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const t = unwrap(await api.get(`/task/${projectId}/tasks/${taskId}`));
    setTask(t);
    const assignee = firstOf(t.assignedTo);
    setForm({
      title: t.title,
      description: t.description || "",
      assignedTo: assignee?._id || assignee || "",
      status: t.status,
    });
  };

  useEffect(() => {
    if (!isNew) load().catch((e) => setError(errMsg(e)));
  }, [taskId]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
    files.forEach((f) => fd.append("attachments", f));
    try {
      if (isNew) {
        await api.post(`/task/${projectId}`, fd);
        onChanged();
        onClose();
      } else {
        await api.patch(`/task/${projectId}/tasks/${taskId}`, fd);
        setFiles([]);
        setEditing(false);
        await load();
        onChanged();
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/task/${projectId}/tasks/${taskId}`);
      onChanged();
      onClose();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const assignee = task && firstOf(task.assignedTo);

  return (
    <Modal title={isNew ? "New task" : task?.title || "Task"} onClose={onClose}>
      <Alert>{error}</Alert>

      {editing ? (
        <form onSubmit={save} className="mt-2 space-y-4">
          <Field label="Title" value={form.title} onChange={set("title")} required />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Assignee</span>
              <select className="input" value={form.assignedTo} onChange={set("assignedTo")}>
                {members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>{m.user.fullName || m.user.userName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select className="input" value={form.status} onChange={set("status")}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Attachments</span>
            {/* backend storage only accepts these image formats, max 5 MB each */}
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.webp"
              className="text-sm"
              onChange={(e) => setFiles([...e.target.files].slice(0, 10))}
            />
            <span className="mt-1 block text-xs text-slate-400">JPG, PNG or WebP, up to 5 MB each</span>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={isNew ? onClose : () => setEditing(false)}>Cancel</button>
            <button className="btn" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      ) : !task ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-4 text-sm">
            <span><span className="text-slate-500">Status: </span>{STATUSES.find((s) => s.value === task.status)?.label}</span>
            <span><span className="text-slate-500">Assignee: </span><span className="capitalize">{assignee?.fullName || assignee?.userName || "—"}</span></span>
          </div>
          {task.description && <p className="whitespace-pre-wrap text-sm">{task.description}</p>}

          {task.attachments?.length > 0 && (
            <div>
              <h4 className="mb-1 text-sm font-semibold">Attachments</h4>
              <ul className="space-y-1 text-sm">
                {task.attachments.map((a, i) => (
                  <li key={a._id || i}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                      {a.publicId?.split("/").pop() || `File ${i + 1}`}
                    </a>
                    <span className="ml-2 text-xs text-slate-400">{a.mimetype} · {Math.round((a.size || 0) / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Subtasks projectId={projectId} taskId={taskId} canManage={canManage} />

          {canManage && (
            <div className="flex justify-between border-t border-slate-100 pt-4">
              <button className="btn-danger" onClick={remove}>Delete task</button>
              <button className="btn-ghost" onClick={() => setEditing(true)}>Edit task</button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Subtasks({ projectId, taskId, canManage }) {
  const base = `/task/${projectId}/tasks/${taskId}/subtasks`;
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get(base).then((res) => setItems(unwrap(res) || []));

  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
  }, [taskId]);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const done = items.filter((s) => s.status === "done").length;

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">
        Subtasks <span className="font-normal text-slate-400">{done}/{items.length}</span>
      </h4>
      <Alert>{error}</Alert>
      <ul className="space-y-1">
        {items.map((s) => (
          <li key={s._id} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={s.status === "done"}
              // members may only mark subtasks done, so unchecking is limited to managers
              disabled={!canManage && s.status === "done"}
              onChange={(e) => run(() => api.patch(`${base}/${s._id}/status`, { status: e.target.checked ? "done" : "todo" }))}
            />
            <span className={`flex-1 text-sm ${s.status === "done" ? "text-slate-400 line-through" : ""}`}>{s.title}</span>
            {canManage && (
              <button className="btn-danger text-xs" onClick={() => run(() => api.delete(`${base}/${s._id}`))}>✕</button>
            )}
          </li>
        ))}
      </ul>
      {canManage && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api.post(base, { title });
              setTitle("");
            });
          }}
        >
          <input className="input py-1" placeholder="Add a subtask…" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <button className="btn py-1">Add</button>
        </form>
      )}
    </div>
  );
}
