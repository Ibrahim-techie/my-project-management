import { useState } from "react";
import { api, errMsg } from "../api";
import {
  AuthLink,
  AuthShell,
  Field,
  FormError,
  SubmitButton,
  TextInput,
  useAuthSubmit,
} from "@/components/auth-shell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAuthSubmit(async () => {
    try {
      await api.post("/auth/forgot-password", { email });
    } catch (e) {
      return errMsg(e);
    }
  });

  const submit = async (e) => {
    e.preventDefault();
    if (await run()) setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we will send you a link to choose a new one."
      below={<AuthLink to="/login">Back to sign in</AuthLink>}
    >
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link is on
          its way.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <SubmitButton busy={busy} busyLabel="Sending">
            Send reset link
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
