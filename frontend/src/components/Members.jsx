import { useState } from "react";
import { api, errMsg } from "../api";
import { Alert, Avatar, RoleBadge } from "./ui.jsx";

const ROLE_OPTIONS = ["member", "project_admin", "admin"];

export default function Members({ projectId, members, isAdmin, currentUserId, reload }) {
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const add = (e) => {
    e.preventDefault();
    const id = identifier.trim();
    const body = id.includes("@") ? { email: id, role } : { username: id, role };
    run(async () => {
      await api.post(`/project/${projectId}/members`, body);
      setIdentifier("");
    });
  };

  return (
    <div className="space-y-4">
      <Alert>{error}</Alert>
      {isAdmin && (
        <form onSubmit={add} className="card flex flex-wrap items-end gap-2">
          <label className="min-w-48 flex-1">
            <span className="mb-1 block text-sm font-medium text-slate-700">Add by email or username</span>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </label>
          <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
          <button className="btn">Add</button>
        </form>
      )}

      <ul className="card divide-y divide-slate-100 p-0">
        {members.map((m) => (
          <li key={m._id} className="flex items-center gap-3 px-4 py-3">
            <Avatar user={m.user} />
            <div className="flex-1">
              <p className="text-sm font-medium capitalize">{m.user?.fullName}</p>
              <p className="text-xs text-slate-500">@{m.user?.userName}</p>
            </div>
            {isAdmin && m.user?._id !== currentUserId ? (
              <>
                <select
                  className="input w-auto py-1"
                  value={m.role}
                  onChange={(e) => run(() => api.put(`/project/${projectId}/members/${m.user._id}`, { newRole: e.target.value }))}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                </select>
                <button
                  className="btn-danger"
                  onClick={() =>
                    confirm(`Remove ${m.user.userName} from this project?`) &&
                    run(() => api.delete(`/project/${projectId}/members/${m.user._id}`))
                  }
                >
                  Remove
                </button>
              </>
            ) : (
              <RoleBadge role={m.role} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
