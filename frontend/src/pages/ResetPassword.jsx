import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, errMsg } from "../api";
import { Alert, AuthCard, Field } from "../components/ui.jsx";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const resetToken = params.get("resetToken");
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/reset-password", { newPassword }, { params: { resetToken } });
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <AuthCard title="Choose a new password" footer={<Link className="text-indigo-600" to="/login">Back to sign in</Link>}>
      {!resetToken ? (
        <Alert>This reset link is missing its token.</Alert>
      ) : done ? (
        <Alert kind="success">Password reset. You can sign in now.</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Alert>{error}</Alert>
          <Field label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <button className="btn w-full">Reset password</button>
        </form>
      )}
    </AuthCard>
  );
}
