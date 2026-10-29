import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errMsg } from "../api";
import { Alert, Field } from "../components/ui.jsx";

export default function Account() {
  const { user } = useAuth();
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const change = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      setMsg("Password changed.");
      setOld("");
      setNew("");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">Profile</h2>
        <dl className="space-y-1 text-sm">
          <div><dt className="inline text-slate-500">Name: </dt><dd className="inline capitalize">{user.fullName}</dd></div>
          <div><dt className="inline text-slate-500">Username: </dt><dd className="inline">{user.userName}</dd></div>
          <div><dt className="inline text-slate-500">Email: </dt><dd className="inline">{user.email}</dd></div>
        </dl>
      </div>
      <form onSubmit={change} className="card space-y-4">
        <h2 className="text-lg font-semibold">Change password</h2>
        <Alert>{error}</Alert>
        <Alert kind="success">{msg}</Alert>
        <Field label="Current password" type="password" value={oldPassword} onChange={(e) => setOld(e.target.value)} required />
        <Field label="New password" type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required />
        <button className="btn">Update password</button>
      </form>
    </div>
  );
}
