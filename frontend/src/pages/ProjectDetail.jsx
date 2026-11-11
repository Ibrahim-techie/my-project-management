import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ChevronRight, KanbanSquare, NotebookText, Pencil, Trash2, Users } from "lucide-react";
import { api, errMsg, ROLES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { useProjectEvents } from "../socket.jsx";
import { ProjectDialog } from "./Projects.jsx";
import TaskBoard from "../components/TaskBoard.jsx";
import Notes from "../components/Notes.jsx";
import Members from "../components/Members.jsx";
import { Alert } from "@/components/ui/alert";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABEL, displayName } from "@/lib/format";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { reloadProjects } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadMembers = useCallback(
    // skip memberships whose user no longer resolves; the task form needs m.user._id
    () =>
      api
        .get(`/project/${projectId}/members`)
        .then((res) => setMembers((unwrap(res) || []).filter((m) => m?.user?._id))),
    [projectId],
  );

  useEffect(() => {
    setProject(null);
    setError("");
    api
      .get(`/project/${projectId}`)
      .then((res) => setProject(unwrap(res)))
      .catch((e) => setError(errMsg(e)));
    loadMembers().catch(() => {});
  }, [projectId, loadMembers]);

  const leaveProject = (message) => {
    toast(message, { tone: "danger" });
    reloadProjects();
    navigate("/projects", { replace: true });
  };

  useProjectEvents(projectId, {
    "member:joined": () => loadMembers().catch(() => {}),
    "member:removed": () => loadMembers().catch(() => {}),
    "member:role-updated": () => loadMembers().catch(() => {}),
    "project:removed": () => leaveProject("You were removed from this project"),
    // the admin who deleted it is already navigating away
    "project:deleted": () => !busy && leaveProject("This project was deleted"),
  });

  const role = members.find((m) => m.user?._id === user._id)?.role;
  const isAdmin = role === ROLES.ADMIN;
  const canManageTasks = isAdmin || role === ROLES.PROJECT_ADMIN;

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/project/${projectId}`);
      await reloadProjects();
      toast("Project deleted");
      navigate("/projects");
    } catch (e) {
      setError(errMsg(e));
      setDeleting(false);
    } finally {
      setBusy(false);
    }
  };

  if (error && !project) {
    return (
      <Alert tone="danger" title="This project could not be opened">
        {error}
      </Alert>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link to="/projects" className="text-muted-foreground transition-colors hover:text-highlight">
          Projects
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span aria-current="page" className="flex min-w-0 items-center gap-1.5 font-medium">
          <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-highlight" />
          <span className="truncate">{project.name}</span>
        </span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-9 font-semibold tracking-tight sm:text-[32px] sm:leading-10">{project.name}</h1>
            {role && <Chip tone={isAdmin ? "brand" : "default"}>{ROLE_LABEL[role]}</Chip>}
          </div>
          {project.description && (
            <p className="mt-1.5 max-w-2xl text-[15px] text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="surface-card flex shrink-0 flex-wrap items-center gap-4 px-4 py-3 hover:border-border">
          <div>
            <p className="label-caps">Team</p>
            <div className="mt-1 flex items-center gap-2">
              <AvatarGroup size="sm" max={4} people={members.map((m) => ({ name: displayName(m.user) }))} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {members.length} member{members.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 sm:border-l sm:border-border sm:pl-3">
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil aria-hidden="true" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleting(true)}
                className="text-danger hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 aria-hidden="true" /> Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="board" className="mt-6">
        <TabsList aria-label="Project sections">
          <TabsTrigger value="board">
            <KanbanSquare aria-hidden="true" /> Board
          </TabsTrigger>
          <TabsTrigger value="notes">
            <NotebookText aria-hidden="true" /> Notes
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users aria-hidden="true" /> Members
            <span className="rounded-full border border-border bg-secondary px-1.5 font-mono text-[11px] text-muted-foreground tabular-nums">
              {members.length}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-6">
          <TaskBoard projectId={projectId} members={members} canManage={canManageTasks} />
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <Notes projectId={projectId} canEdit={isAdmin} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <Members
            projectId={projectId}
            members={members}
            isAdmin={isAdmin}
            currentUserId={user._id}
            reload={async () => {
              await loadMembers();
              reloadProjects();
            }}
          />
        </TabsContent>
      </Tabs>

      <ProjectDialog
        open={editing}
        project={project}
        onClose={() => setEditing(false)}
        onSaved={(p) => {
          setProject(p);
          reloadProjects();
        }}
      />

      <ConfirmDialog
        open={deleting}
        title={`Delete ${project.name}?`}
        confirmLabel="Delete project"
        busyLabel="Deleting"
        cancelLabel="Keep it"
        typeToConfirm={project.name}
        busy={busy}
        onConfirm={remove}
        onCancel={() => setDeleting(false)}
      >
        This removes the project for all {members.length} member{members.length === 1 ? "" : "s"}. Its tasks and
        notes will no longer be reachable. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
