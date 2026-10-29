import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import { api, errMsg, ROLES, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
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
    () => api.get(`/project/${projectId}/members`).then((res) => setMembers(unwrap(res) || [])),
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
      <Link
        to="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand"
      >
        <ChevronLeft className="size-4" aria-hidden="true" /> Projects
      </Link>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">{project.name}</h1>
            {role && <Chip tone={isAdmin ? "brand" : "default"}>{ROLE_LABEL[role]}</Chip>}
          </div>
          {project.description && (
            <p className="mt-2 max-w-2xl text-subtle-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <AvatarGroup
            size="sm"
            max={4}
            people={members.map((m) => ({ name: displayName(m.user) }))}
          />
          {isAdmin && (
            <>
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
            </>
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
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
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
