import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CircleAlert, MailCheck } from "lucide-react";
import { api, errMsg } from "../api";
import { useAuth } from "../auth.jsx";
import { AuthLink, AuthShell } from "@/components/auth-shell";
import { Spinner } from "@/components/ui/spinner";

export default function VerifyEmail() {
  const { token } = useParams();
  const { user } = useAuth();
  const [state, setState] = useState({ status: "loading" });
  const sent = useRef(false);

  useEffect(() => {
    // the token is single-use, so don't send it twice under StrictMode
    if (sent.current) return;
    sent.current = true;
    api
      .get(`/auth/verify-email/${encodeURIComponent(token)}`)
      .then(() => setState({ status: "done" }))
      .catch((e) => setState({ status: "error", message: errMsg(e) }));
  }, [token]);

  const next = user ? (
    <AuthLink to="/">Go to your dashboard</AuthLink>
  ) : (
    <AuthLink to="/login">Sign in</AuthLink>
  );

  if (state.status === "loading") {
    return (
      <AuthShell title="Verifying your email">
        <div className="flex justify-center py-4">
          <Spinner label="Verifying your email" className="[&_svg]:size-6" />
        </div>
      </AuthShell>
    );
  }

  if (state.status === "error") {
    return (
      <AuthShell title="We couldn't verify your email" below={next}>
        <div className="space-y-3 text-center">
          <CircleAlert className="mx-auto size-8 text-danger" aria-hidden="true" />
          <p className="text-sm text-subtle-foreground">{state.message}.</p>
          <p className="text-sm text-subtle-foreground">
            Each link works once and expires after an hour. If you already verified, you can sign in now.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Email verified" below={next}>
      <div className="space-y-3 text-center">
        <MailCheck className="mx-auto size-8 text-status-done" aria-hidden="true" />
        <p className="text-sm text-subtle-foreground">
          Your account is ready. <span className="highlight">Sign in</span> to start working with your team.
        </p>
      </div>
    </AuthShell>
  );
}
