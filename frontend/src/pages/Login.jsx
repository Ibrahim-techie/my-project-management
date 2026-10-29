import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { errMsg } from "../api";
import { Alert, AuthCard, Field } from "../components/ui.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/projects" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(identifier.trim(), password);
      navigate(location.state?.from?.pathname || "/projects", { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to your account"
      footer={
        <>
          No account? <Link className="text-indigo-600" to="/register">Register</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <Link to="/forgot-password" className="block text-center text-sm text-slate-500 hover:text-indigo-600">
          Forgot password?
        </Link>
      </form>
    </AuthCard>
  );
}
