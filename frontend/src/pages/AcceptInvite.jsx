import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircleAlert, MailCheck, MailX } from "lucide-react";
import { api, errMsg, unwrap } from "../api";
import { useAuth } from "../auth.jsx";
import { AuthLink, AuthShell, FormError } from "@/components/auth-shell";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABEL, displayName, shortDate } from "@/lib/format";

const reasonOf = (e) => e.response?.data?.errors?.[0]?.reason;

export default function AcceptInvite() {
  const { token } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [invite, setInvite] = useState(null);
  const [problem, setProblem] = useState(null); // { message, reason }
  const [busy, setBusy] = useState(null); // "accept" | "decline"
  const [declined, setDeclined] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api
      .get(`/invites/${token}`)
      .then((res) => setInvite(unwrap(res)))
      .catch((e) => setProblem({ message: errMsg(e), reason: reasonOf(e) }));
  }, [token]);

  const respond = async (accept) => {
    setBusy(accept ? "accept" : "decline");
    setActionError("");
    try {
      const res = await api.post(`/invites/${token}/${accept ? "accept" : "decline"}`);
      if (accept) {
        toast(`Welcome to ${invite.project.name}`, { tone: "success" });
        navigate(`/projects/${unwrap(res).projectId}`, { replace: true });
      } else {
        setDeclined(true);
      }
    } catch (e) {
      if (reasonOf(e)) setProblem({ message: errMsg(e), reason: reasonOf(e) });
      else setActionError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const below = <AuthLink to="/">Go to your dashboard</AuthLink>;

  if (problem) {
    const wrongAccount = problem.reason === "wrong_account";
    return (
      <AuthShell title={wrongAccount ? "This invite is for someone else" : "This invite can't be used"} below={below}>
        <div className="space-y-4 text-center">
          <CircleAlert className="mx-auto size-8 text-danger" aria-hidden="true" />
          <p className="text-sm text-subtle-foreground">{problem.message}.</p>
          {wrongAccount && (
            <>
              <p className="text-sm text-subtle-foreground">
                You are signed in as <span className="font-medium text-foreground">@{user.userName}</span>.
              </p>
              <Button
                variant="solid"
                className="w-full"
                onClick={async () => {
                  await logout();
                  navigate("/login", { state: { from: { pathname: `/invites/${token}` } } });
                }}
              >
                Sign in with another account
              </Button>
            </>
          )}
        </div>
      </AuthShell>
    );
  }

  if (declined) {
    return (
      <AuthShell title="Invite declined" below={below}>
        <div className="space-y-3 text-center">
          <MailX className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-subtle-foreground">
            You won&apos;t be added to {invite.project.name}. A project admin can invite you again if you change your mind.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="You're invited"
      description={
        invite ? (
          <>
            Join <span className="highlight">{invite.project.name}</span> on Project Camp.
          </>
        ) : null
      }
      below={below}
    >
      {!invite ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <UserAvatar user={invite.invitedBy} className="size-10" />
            <p className="text-sm text-subtle-foreground">
              <span className="font-medium text-foreground">{displayName(invite.invitedBy)}</span> invited you to
              join as
              <Chip tone="brand" className="ml-1.5 align-middle">
                {ROLE_LABEL[invite.role]}
              </Chip>
            </p>
          </div>
          {invite.project.description && (
            <p className="rounded-lg border border-border bg-input-bg px-3 py-2.5 text-sm text-subtle-foreground">
              {invite.project.description}
            </p>
          )}
          <FormError message={actionError} />
          <div className="grid gap-2">
            <Button variant="solid" size="lg" iconRight={<MailCheck />} onClick={() => respond(true)} disabled={!!busy}>
              {busy === "accept" ? "Joining" : "Accept invite"}
            </Button>
            <Button variant="ghost" onClick={() => respond(false)} disabled={!!busy}>
              {busy === "decline" ? "Declining" : "Decline"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">Valid until {shortDate(invite.expiresAt)}</p>
        </div>
      )}
    </AuthShell>
  );
}

