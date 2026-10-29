import { useState } from "react";
import { Link } from "react-router-dom";
import { api, errMsg } from "../api";
import { Alert, AuthCard, Field } from "../components/ui.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMsg(res.data.message);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <AuthCard title="Reset your password" footer={<Link className="text-indigo-600" to="/login">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button className="btn w-full">Send reset link</button>
      </form>
    </AuthCard>
  );
}
