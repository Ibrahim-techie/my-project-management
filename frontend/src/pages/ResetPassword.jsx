import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errMsg } from "../api";
import {
  AuthLink,
  AuthShell,
  Field,
  FormError,
  PasswordInput,
  SubmitButton,
  useAuthSubmit,
} from "@/components/auth-shell";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const resetToken = params.get("resetToken");
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const { busy, error, run } = useAuthSubmit(async () => {
    try {
      await api.post("/auth/reset-password", { newPassword }, { params: { resetToken } });
    } catch (e) {
      return errMsg(e);
    }
  });

  const submit = async (e) => {
    e.preventDefault();
    if (await run()) setDone(true);
  };

  return (
    <AuthShell title="Choose a new password" below={<AuthLink to="/login">Back to sign in</AuthLink>}>
      {!resetToken ? (
        <FormError message="This reset link is missing its token. Request a new one from the sign in page." />
      ) : done ? (
        <p className="text-center text-sm text-muted-foreground">
          Your password is updated. <AuthLink to="/login">Sign in</AuthLink> with it now.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <Field label="New password">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              autoFocus
            />
          </Field>
          <SubmitButton busy={busy} busyLabel="Saving">
            Save password
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
