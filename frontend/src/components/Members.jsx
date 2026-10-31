import { useCallback, useEffect, useState } from "react";
import { MailPlus, RotateCw } from "lucide-react";
import { api, errMsg, unwrap } from "../api";
import { UserAvatar } from "@/components/user-avatar";
import { UserPicker } from "@/components/user-picker";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABEL, displayName, relativeTime } from "@/lib/format";

const ROLE_OPTIONS = ["member", "project_admin", "admin"];

export default function Members({ projectId, members, isAdmin, currentUserId, reload }) {
  const toast = useToast();
  const [invitee, setInvitee] = useState(null);
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [invites, setInvites] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadInvites = useCallback(() => {
    if (!isAdmin) return Promise.resolve();
    return api
      .get(`/project/${projectId}/invites`)
      .then((res) => setInvites(unwrap(res) || []))
      .catch(() => setInvites([]));
  }, [projectId, isAdmin]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const run = async (fn, message, after = reload) => {
    setBusy(true);
    try {
      await fn();
      await after();
      if (message) toast(message, { tone: "success" });
      return true;
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    if (!invitee) return;
    setError("");
    setBusy(true);
    try {
      await api.post(`/project/${projectId}/members`, { userId: invitee._id, role });
      await loadInvites();
      toast(`Invite emailed to @${invitee.userName}`, { tone: "success" });
      setInvitee(null);
      setRole("member");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {isAdmin && (
        <form onSubmit={invite} className="surface-card p-4 sm:p-5">
          <p className="mb-1 flex items-center gap-2 font-montserrat font-semibold">
            <MailPlus className="size-4 text-accent-foreground" aria-hidden="true" /> Invite a teammate
          </p>
          <p className="mb-4 text-sm text-subtle-foreground">
            They get an email and join once they <span className="highlight">accept the invite</span>.
          </p>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Field label="Username" error={error} className="flex-1">
              <UserPicker projectId={projectId} value={invitee} onChange={(u) => { setInvitee(u); setError(""); }} />
            </Field>
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)} wrapperClassName="w-full lg:w-40" className="h-10">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="solid" size="lg" disabled={busy || !invitee}>
              {busy ? "Sending" : "Send invite"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Only people with a verified Project Camp account show up. Project admins can manage tasks; admins can also
            manage members and notes.
          </p>
        </form>
      )}

      {isAdmin && invites.length > 0 && (
        <section aria-labelledby="pending-invites">
          <h3 id="pending-invites" className="mb-2 px-1 text-sm font-medium text-subtle-foreground">
            Pending invites ({invites.length})
          </h3>
          <ul className="surface-card divide-y divide-border/60">
            {invites.map((inv) => (
              <li key={inv._id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <UserAvatar user={inv.invitedUser} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{displayName(inv.invitedUser)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{inv.invitedUser?.userName} · {ROLE_LABEL[inv.role]} · sent {relativeTime(inv.updatedAt)}
                  </p>
                </div>
                {inv.expired ? <Chip tone="blocked">Expired</Chip> : <Chip tone="in_progress">Waiting</Chip>}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => api.post(`/project/${projectId}/invites/${inv._id}/resend`),
                        `Invite resent to @${inv.invitedUser?.userName}`,
                        loadInvites,
                      )
                    }
                  >
                    <RotateCw aria-hidden="true" /> Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => setCancelling(inv)}
                  >
                    Cancel
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="member-list">
        <h3 id="member-list" className="mb-2 px-1 text-sm font-medium text-subtle-foreground">
          Members ({members.length})
        </h3>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                      onClick={() => setRemoving(m)}
                    >
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
      </section>

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

      <ConfirmDialog
        open={!!cancelling}
        title={cancelling ? `Cancel the invite for @${cancelling.invitedUser?.userName}?` : ""}
        confirmLabel="Cancel invite"
        busyLabel="Cancelling"
        cancelLabel="Keep it"
        busy={busy}
        onConfirm={async () => {
          await run(() => api.delete(`/project/${projectId}/invites/${cancelling._id}`), "Invite cancelled", loadInvites);
          setCancelling(null);
        }}
        onCancel={() => setCancelling(null)}
      >
        The link in their email will stop working. You can invite them again later.
      </ConfirmDialog>
    </div>
  );
}
