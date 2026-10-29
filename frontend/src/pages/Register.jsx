import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errMsg } from "../api";
import { Alert, AuthCard, Field } from "../components/ui.jsx";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", userName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/auth/register", form);
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      footer={
        <>
          Already registered? <Link className="text-indigo-600" to="/login">Sign in</Link>
        </>
      }
    >
      {done ? (
        <Alert kind="success">
          Account created. Check your inbox for a verification link, then sign in.
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Alert>{error}</Alert>
          <Field label="Full name" value={form.fullName} onChange={set("fullName")} required />
          <Field label="Username" value={form.userName} onChange={set("userName")} required />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} required />
          <Field label="Password" type="password" value={form.password} onChange={set("password")} required />
          <button className="btn w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
        </form>
      )}
    </AuthCard>
  );
}
