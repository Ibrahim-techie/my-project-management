import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { api, errMsg } from "../api";
import { PasswordInput } from "@/components/auth-shell";
import { PageTitle } from "@/components/page";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { displayName, shortDate } from "@/lib/format";

export default function Account() {
  const { user } = useAuth();
  const toast = useToast();
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      toast("Password changed", { tone: "success" });
      setOld("");
      setNew("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="Your account" />

      <section className="surface-card mt-8 flex items-center gap-4 p-4 sm:p-5">
        <UserAvatar user={user} className="size-12 shrink-0 sm:size-14 [&_[data-slot=avatar-fallback]]:text-base" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{displayName(user)}</p>
          {/* on phones the badge sits under the name instead of squeezing it */}
          {user.isEmailVerified && (
            <Chip tone="success" className="mt-1 mb-1.5 sm:hidden">
              Verified
            </Chip>
          )}
          {/* stacked on phones so the email is not cut down to "i…" */}
          <p className="text-sm text-muted-foreground sm:truncate">
            <span className="block sm:inline">@{user.userName}</span>
            <span className="hidden sm:inline"> · </span>
            <span className="block [overflow-wrap:anywhere] sm:inline">{user.email}</span>
          </p>
          {user.createdAt && <p className="mt-1 text-xs text-muted-foreground">Member since {shortDate(user.createdAt)}</p>}
        </div>
        {user.isEmailVerified && (
          <Chip tone="success" className="hidden shrink-0 sm:inline-flex">
            Verified
          </Chip>
        )}
      </section>

      <form onSubmit={change} className="surface-card mt-6 space-y-4 p-5">
        <h2 className="font-semibold">Change password</h2>
        <Field label="Current password">
          <PasswordInput value={oldPassword} onChange={(e) => setOld(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Field label="New password" error={error}>
          <PasswordInput value={newPassword} onChange={(e) => setNew(e.target.value)} autoComplete="new-password" required />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" variant="solid" disabled={busy || !oldPassword || !newPassword}>
            {busy ? "Saving" : "Update password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
