import { useEffect, useState } from "react";
import { api, errMsg, unwrap } from "../api";
import { Alert } from "./ui.jsx";

export default function Notes({ projectId, canEdit }) {
  const [notes, setNotes] = useState(null);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api
      .get(`/notes/${projectId}`)
      .then((res) => setNotes(unwrap(res) || []))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
  }, [projectId]);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-4">
      <Alert>{error}</Alert>
      {canEdit && (
        <form
          className="card space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api.post(`/notes/${projectId}`, { content: draft });
              setDraft("");
            });
          }}
        >
          <textarea className="input" rows={3} placeholder="Write a note…" value={draft} onChange={(e) => setDraft(e.target.value)} required />
          <div className="text-right"><button className="btn">Add note</button></div>
        </form>
      )}

      {notes === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : notes.length === 0 ? (
        <div className="card text-center text-slate-500">No notes yet.</div>
      ) : (
        notes.map((n) => (
          <div key={n._id} className="card">
            {editingId === n._id ? (
              <div className="space-y-2">
                <textarea className="input" rows={4} value={editText} onChange={(e) => setEditText(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                  <button
                    className="btn"
                    onClick={() =>
                      run(async () => {
                        await api.put(`/notes/${projectId}/n/${n._id}`, { content: editText });
                        setEditingId(null);
                      })
                    }
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    {n.createdBy?.fullName || n.createdBy?.userName ? `${n.createdBy.fullName || n.createdBy.userName} · ` : ""}
                    {new Date(n.updatedAt || n.createdAt).toLocaleString()}
                  </span>
                  {canEdit && (
                    <span className="flex gap-1">
                      <button className="btn-ghost py-0.5" onClick={() => { setEditingId(n._id); setEditText(n.content); }}>Edit</button>
                      <button className="btn-danger" onClick={() => confirm("Delete this note?") && run(() => api.delete(`/notes/${projectId}/n/${n._id}`))}>
                        Delete
                      </button>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
