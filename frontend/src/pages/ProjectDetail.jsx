import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errMsg, ROLES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { Alert, RoleBadge } from "../components/ui.jsx";
import { ProjectForm } from "./Projects.jsx";
import TaskBoard from "../components/TaskBoard.jsx";
import Notes from "../components/Notes.jsx";
import Members from "../components/Members.jsx";

const TABS = ["Board", "Notes", "Members"];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("Board");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = useCallback(
    () => api.get(`/project/${projectId}/members`).then((res) => setMembers(unwrap(res) || [])),
    [projectId],
  );

  useEffect(() => {
    api
      .get(`/project/${projectId}`)
      .then((res) => setProject(unwrap(res)))
      .catch((e) => setError(errMsg(e)));
    loadMembers().catch((e) => setError(errMsg(e)));
  }, [projectId, loadMembers]);

  const role = members.find((m) => m.user?._id === user._id)?.role;
  const isAdmin = role === ROLES.ADMIN;
  const canManageTasks = isAdmin || role === ROLES.PROJECT_ADMIN;

  const remove = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/project/${projectId}`);
      navigate("/projects");
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (error && !project) return <Alert>{error}</Alert>;
  if (!project) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <Link to="/projects" className="text-sm text-slate-500 hover:text-indigo-600">← All projects</Link>
      <div className="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {role && <RoleBadge role={role} />}
          </div>
          {project.description && <p className="mt-1 text-slate-500">{project.description}</p>}
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn-ghost text-red-600" onClick={remove}>Delete</button>
          </div>
        )}
      </div>
      <Alert>{error}</Alert>

      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Board" && <TaskBoard projectId={projectId} members={members} canManage={canManageTasks} />}
      {tab === "Notes" && <Notes projectId={projectId} canEdit={isAdmin} />}
      {tab === "Members" && (
        <Members projectId={projectId} members={members} isAdmin={isAdmin} currentUserId={user._id} reload={loadMembers} />
      )}

      {editing && (
        <ProjectForm
          project={project}
          onClose={() => setEditing(false)}
          onSaved={(p) => {
            setProject(p);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
