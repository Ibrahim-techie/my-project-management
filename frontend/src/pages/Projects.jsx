import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errMsg, unwrap } from "../api";
import { Alert, Field, Modal, RoleBadge } from "../components/ui.jsx";

export default function Projects() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () =>
    api
      .get("/project")
      .then((res) => setItems(unwrap(res) || []))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button className="btn" onClick={() => setCreating(true)}>+ New project</button>
      </div>
      <Alert>{error}</Alert>

      {items === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="card text-center text-slate-500">No projects yet. Create your first one.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ project, role }) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="card block transition hover:border-indigo-300 hover:shadow">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold">{project.name}</h3>
                <RoleBadge role={role} />
              </div>
              <p className="line-clamp-2 min-h-10 text-sm text-slate-500">{project.description || "No description"}</p>
              <p className="mt-3 text-xs text-slate-400">
                {project.members} member{project.members === 1 ? "" : "s"} · created{" "}
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {creating && (
        <ProjectForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export function ProjectForm({ project, onClose, onSaved }) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = project
        ? await api.put(`/project/${project._id}`, { name, description })
        : await api.post("/project", { name, description });
      onSaved(unwrap(res));
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <Modal title={project ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn">Save</button>
        </div>
      </form>
    </Modal>
  );
}
