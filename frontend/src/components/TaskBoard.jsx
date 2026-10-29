import { useEffect, useState } from "react";
import { api, errMsg, STATUSES, unwrap } from "../api";
import { Alert, Avatar } from "./ui.jsx";
import TaskModal from "./TaskModal.jsx";

export default function TaskBoard({ projectId, members, canManage }) {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null); // task id, "new", or null
  const [filter, setFilter] = useState("");

  const load = () =>
    api
      .get(`/task/${projectId}`)
      .then((res) => setTasks(unwrap(res) || []))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
  }, [projectId]);

  const move = async (task, status) => {
    if (task.status === status) return;
    setTasks((ts) => ts.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.patch(`/task/${projectId}/tasks/${task._id}`, { status });
    } catch (e) {
      setError(errMsg(e));
      load();
    }
  };

  const visible = (tasks || []).filter(
    (t) => !filter || (t.assignedTo?._id || t.assignedTo) === filter,
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.user._id} value={m.user._id}>{m.user.fullName || m.user.userName}</option>
          ))}
        </select>
        {canManage && <button className="btn" onClick={() => setOpen("new")}>+ New task</button>}
      </div>
      <Alert>{error}</Alert>

      {tasks === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {STATUSES.map((col) => {
            const colTasks = visible.filter((t) => t.status === col.value);
            return (
              <div
                key={col.value}
                className="rounded-lg bg-slate-100 p-3"
                onDragOver={(e) => canManage && e.preventDefault()}
                onDrop={(e) => {
                  const task = tasks.find((t) => t._id === e.dataTransfer.getData("text/plain"));
                  if (task) move(task, col.value);
                }}
              >
                <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-600">
                  {col.label}
                  <span className="rounded-full bg-white px-2 text-xs">{colTasks.length}</span>
                </h3>
                <div className="min-h-24 space-y-2">
                  {colTasks.map((t) => (
                    <button
                      key={t._id}
                      draggable={canManage}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", t._id)}
                      onClick={() => setOpen(t._id)}
                      className="card block w-full cursor-pointer p-3 text-left hover:border-indigo-300"
                    >
                      <p className="text-sm font-medium">{t.title}</p>
                      {t.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{t.description}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        {typeof t.assignedTo === "object" ? <Avatar user={t.assignedTo} /> : <span />}
                        {t.attachments?.length > 0 && (
                          <span className="text-xs text-slate-400">📎 {t.attachments.length}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <TaskModal
          projectId={projectId}
          taskId={open === "new" ? null : open}
          members={members}
          canManage={canManage}
          onClose={() => setOpen(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
