import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { api, errMsg, unwrap } from "../api";
import { EmptyState, PageTitle } from "@/components/page";
import { ProjectCard } from "./Dashboard.jsx";
import { Reveal } from "@/components/reveal";
import { SearchField } from "@/components/search-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useHotkey } from "@/lib/use-hotkey";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "admin", label: "I manage" },
  { value: "member", label: "I am in" },
];

export default function Projects() {
  const { projects, reloadProjects } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const creating = params.get("new") === "1";
  const setCreating = (on) => setParams(on ? { new: "1" } : {}, { replace: true });
  useHotkey("n", () => setCreating(true), { enabled: !creating });

  const visible = (projects || []).filter(({ project, role }) => {
    const q = query.trim().toLowerCase();
    if (q && !`${project.name} ${project.description || ""}`.toLowerCase().includes(q)) return false;
    if (filter === "admin") return role === "admin";
    if (filter === "member") return role !== "admin";
    return true;
  });

  return (
    <div>
      <PageTitle title="Projects">
        Everything your team is building, <span className="highlight">in one place</span>.
      </PageTitle>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{visible.length}</span>{" "}
            project{visible.length === 1 ? "" : "s"}
          </p>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <Segmented label="Filter projects" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
        <div className="flex items-center gap-2">
          <SearchField
            label="Search projects"
            value={query}
            onChange={setQuery}
            className="flex-1 lg:w-56 lg:flex-none"
          />
          <Button variant="solid" aria-keyshortcuts="n" title="New project (N)" onClick={() => setCreating(true)}>
            New project
            <Kbd aria-hidden="true" className="ml-0.5 hidden border-on-brand/20 bg-on-brand/10 text-on-brand/70 lg:inline-flex">
              N
            </Kbd>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        {projects === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={projects.length ? "No projects match" : "No projects yet"}
          >
            {projects.length
              ? "Try a different search or filter."
              : "Create your first project, then invite teammates from its members tab."}
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ project, role }, i) => (
              <Reveal key={project._id} index={i} className="h-full">
                <ProjectCard project={project} role={role} />
              </Reveal>
            ))}
          </div>
        )}
      </div>

      <ProjectDialog open={creating} onClose={() => setCreating(false)} onSaved={reloadProjects} />
    </div>
  );
}

export function ProjectDialog({ open, project, onClose, onSaved }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project?.name || "");
    setDescription(project?.description || "");
    setError("");
  }, [open, project]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = project
        ? await api.put(`/project/${project._id}`, { name, description })
        : await api.post("/project", { name, description });
      const saved = unwrap(res);
      await onSaved?.(saved);
      onClose();
      toast(project ? "Project updated" : "Project created", { tone: "success" });
      if (!project) navigate(`/projects/${saved._id}`);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={busy}
      title={project ? "Edit project" : "New project"}
      description={project ? undefined : "You will be its admin. Add teammates once it exists."}
    >
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Description" aside="Optional">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="solid" disabled={busy || !name.trim()}>
            {busy ? "Saving" : project ? "Save changes" : "Create project"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
