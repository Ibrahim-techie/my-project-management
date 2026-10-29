import { useState } from "react";
import { UserPlus } from "lucide-react";
import { api, errMsg } from "../api";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABEL, displayName } from "@/lib/format";

const ROLE_OPTIONS = ["member", "project_admin", "admin"];

export default function Members({ projectId, members, isAdmin, currentUserId, reload }) {
  const toast = useToast();
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      await reload();
      if (message) toast(message, { tone: "success" });
      return true;
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const id = identifier.trim();
    setError("");
    setBusy(true);
    try {
      await api.post(`/project/${projectId}/members`, id.includes("@") ? { email: id, role } : { username: id, role });
      await reload();
      toast(`Added ${id}`, { tone: "success" });
      setIdentifier("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {isAdmin && (
        <form onSubmit={add} className="surface-card p-4 sm:p-5">
          <p className="mb-3 flex items-center gap-2 font-montserrat font-semibold">
            <UserPlus className="size-4" aria-hidden="true" /> Add a teammate
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Email or username" error={error} className="flex-1">
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </Field>
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)} wrapperClassName="w-full sm:w-40">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="solid" disabled={busy || !identifier.trim()}>
              Add
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            They need a Project Camp account first. Project admins can manage tasks; admins can also manage members and
            notes.
          </p>
        </form>
      )}

      <ul className="surface-card divide-y divide-border/60">
        {members.map((m) => {
          const self = m.user?._id === currentUserId;
          return (
            <li key={m._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <UserAvatar user={m.user} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {displayName(m.user)}
                  {self && <span className="font-normal text-muted-foreground"> (you)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{m.user?.userName}</p>
              </div>
              {isAdmin && !self ? (
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`Role for ${displayName(m.user)}`}
                    value={m.role}
                    disabled={busy}
                    onChange={(e) =>
                      run(
                        () => api.put(`/project/${projectId}/members/${m.user._id}`, { newRole: e.target.value }),
                        `${displayName(m.user)} is now ${ROLE_LABEL[e.target.value].toLowerCase()}`,
                      )
                    }
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </Select>
                  <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10 hover:text-danger" onClick={() => setRemoving(m)}>
                    Remove
                  </Button>
                </div>
              ) : (
                <Chip tone={m.role === "admin" ? "brand" : "default"}>{ROLE_LABEL[m.role]}</Chip>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={!!removing}
        title={removing ? `Remove ${displayName(removing.user)}?` : ""}
        confirmLabel="Remove member"
        busyLabel="Removing"
        cancelLabel="Keep them"
        busy={busy}
        onConfirm={async () => {
          await run(() => api.delete(`/project/${projectId}/members/${removing.user._id}`), "Member removed");
          setRemoving(null);
        }}
        onCancel={() => setRemoving(null)}
      >
        They will lose access to this project&apos;s board and notes. Tasks assigned to them stay on the board.
      </ConfirmDialog>
    </div>
  );
}
