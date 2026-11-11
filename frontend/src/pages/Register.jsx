import { useState } from "react";
import { MailCheck } from "lucide-react";
import { ResendVerification } from "@/components/resend-verification";
import { api, errMsg } from "../api";
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

export default function Register() {
  const [form, setForm] = useState({ fullName: "", userName: "", email: "", password: "" });
  const [sentTo, setSentTo] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const { busy, error, run } = useAuthSubmit(async () => {
    try {
      await api.post("/auth/register", form);
    } catch (e) {
      return errMsg(e);
    }
  });

  const submit = async (e) => {
    e.preventDefault();
    if (await run()) setSentTo(form.email);
  };

  if (sentTo) {
    return (
      <AuthShell
        title="Check your inbox"
        below={<AuthLink to="/login">Back to sign in</AuthLink>}
      >
        <div className="space-y-3">
          <MailCheck className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            We sent a verification link to <span className="font-medium text-foreground">{sentTo}</span>. Open it,
            then sign in. It works for one hour.
          </p>
          <p className="pt-2 text-xs text-muted-foreground">Didn&apos;t get it? Check spam, or</p>
          <ResendVerification email={sentTo} />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Build your team on CAMP"
      description="Plan, assign and ship work together, with boards, deadlines and reminders in one place."
      below={
        <>
          Already have an account? <AuthLink to="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormError message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput value={form.fullName} onChange={set("fullName")} autoComplete="name" required autoFocus />
          </Field>
          <Field label="Username" hint="Lowercase, used when teammates add you">
            <TextInput value={form.userName} onChange={set("userName")} autoComplete="username" required />
          </Field>
        </div>
        <Field label="Email">
          <TextInput type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={set("password")} autoComplete="new-password" required />
        </Field>
        <SubmitButton busy={busy} busyLabel="Creating account">
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
