import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { errMsg } from "../api";
import {
  AuthLink,
  AuthShell,
  Field,
  FormError,
  PasswordInput,
  SubmitButton,
  TextInput,
  useAuthSubmit,
} from "@/components/auth-shell";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { busy, error, run } = useAuthSubmit(async () => {
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      return errMsg(e);
    }
  });

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (await run()) navigate(location.state?.from?.pathname || "/", { replace: true });
  };

  return (
    <AuthShell
      title="Welcome back"
      description={
        <>
          Pick up where you left off with <span className="highlight">your team&apos;s projects</span>.
        </>
      }
      below={
        <>
          New to Project Camp? <AuthLink to="/register">Create an account</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Email or username">
          <TextInput
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </Field>
        <Field label="Password" aside={<AuthLink to="/forgot-password">Forgot it?</AuthLink>}>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <SubmitButton busy={busy} busyLabel="Signing in">
          Sign in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
