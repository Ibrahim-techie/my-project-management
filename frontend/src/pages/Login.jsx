import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { oauthStartUrl, useAuth, useOAuthProviders } from "../auth.jsx";
import { errMsg } from "../api";
import {
  AuthLink,
  AuthShell,
  Field,
  FormError,
  OAuthButtons,
  PasswordInput,
  SubmitButton,
  TextInput,
  oauthErrorMessage,
  useAuthSubmit,
} from "@/components/auth-shell";
import { ResendVerification } from "@/components/resend-verification";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const providers = useOAuthProviders();
  // set when Google or GitHub sign-in came back to this page with a problem
  const oauthError = oauthErrorMessage(params.get("oauth_error"), params.get("provider"));
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useAuthSubmit(async () => {
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      return errMsg(e);
    }
  });

  // Signing in sets `user` before submit resolves, so this redirect is what
  // actually runs: send people back to the page that asked them to sign in
  const from = location.state?.from;
  const returnTo = from ? `${from.pathname}${from.search || ""}` : "/";
  if (user) return <Navigate to={returnTo} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (params.has("oauth_error")) setParams({}, { replace: true });
    if (await run()) navigate(returnTo, { replace: true });
  };

  return (
    <AuthShell
      title="Welcome back to CAMP"
      description="Sign in to pick up your team's projects, boards and deadlines."
      below={
        <>
          Don&apos;t have an account yet? <AuthLink to="/register">Create an account</AuthLink>
        </>
      }
    >
      <div className="space-y-6">
        <OAuthButtons
          providers={providers}
          onSelect={(provider) => window.location.assign(oauthStartUrl(provider, returnTo))}
        />
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error || oauthError} />
          {/verify your email/i.test(error || "") && (
            <ResendVerification email={identifier.includes("@") ? identifier.trim() : ""} />
          )}
          <Field label="Email or username">
            <TextInput
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </Field>
          <Field label="Password" aside={<AuthLink to="/forgot-password" className="text-xs">Forgot password?</AuthLink>}>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </Field>
          <SubmitButton busy={busy} busyLabel="Signing in">
            Sign in to CAMP
          </SubmitButton>
        </form>
      </div>
    </AuthShell>
  );
}
