import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { api, errMsg, unwrap } from "../api";
import { AnimatedBadge } from "@/components/animated-badge";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABEL, displayName, relativeTime } from "@/lib/format";

/** Invites waiting for the signed-in user, with accept and decline in place. */
export function PendingInvites({ onJoined }) {
  const toast = useToast();
  const navigate = useNavigate();
  const still = useReducedMotion();
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState(null);

  const load = useCallback(
    () =>
      api
        .get("/invites")
        .then((res) => setInvites(unwrap(res) || []))
        .catch(() => setInvites([])),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (inv, accept) => {
    setBusy(inv._id);
    try {
      const res = await api.post(`/invites/id/${inv._id}/${accept ? "accept" : "decline"}`);
      setInvites((all) => all.filter((i) => i._id !== inv._id));
      if (accept) {
        toast(`You joined ${inv.project.name}`, { tone: "success" });
        await onJoined?.();
        navigate(`/projects/${unwrap(res).projectId}`);
      } else {
        toast(`Declined the invite to ${inv.project.name}`);
      }
    } catch (e) {
      toast(errMsg(e), { tone: "danger" });
      load();
    } finally {
      setBusy(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <section aria-labelledby="invites-heading" className="space-y-3">
      <AnimatedBadge>
        <span id="invites-heading">
          {invites.length === 1 ? "You have a project invite" : `You have ${invites.length} project invites`}
        </span>
      </AnimatedBadge>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {invites.map((inv) => (
            <motion.li
              key={inv._id}
              layout={!still}
              initial={still ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? undefined : { opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
            >
              <UserAvatar user={inv.invitedBy} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{displayName(inv.invitedBy)}</span>
                  <span className="text-subtle-foreground"> invited you to </span>
                  <span className="font-montserrat font-semibold">{inv.project.name}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Chip tone="brand">{ROLE_LABEL[inv.role]}</Chip> {relativeTime(inv.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={busy === inv._id} onClick={() => respond(inv, false)}>
                  Decline
                </Button>
                <Button variant="solid" size="sm" disabled={busy === inv._id} onClick={() => respond(inv, true)}>
                  {busy === inv._id ? "Joining" : "Accept"}
                </Button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
