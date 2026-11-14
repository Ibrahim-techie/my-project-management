import { useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { ResendVerification } from "@/components/resend-verification";
import { UsernameField } from "@/components/username-field";
import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from "@/lib/username-rules";
import { useUsernameAvailability } from "@/lib/use-username-availability";
import { api, errMsg } from "../api";
import { oauthStartUrl, useOAuthProviders } from "../auth.jsx";
import {
  AuthLink,
  AuthShell,
  Field,
  FormError,
  OAuthButtons,
  PasswordInput,
  SubmitButton,
  TextInput,
  useAuthSubmit,
} from "@/components/auth-shell";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", userName: "", email: "", password: "" });
  const [sentTo, setSentTo] = useState("");
  const providers = useOAuthProviders();
  const username = useUsernameAvailability(form.userName);
  const userNameInput = useRef(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pickUserName = (userName) => {
    setForm({ ...form, userName });
    username.checkNow(userName);
    userNameInput.current?.focus();
  };

  const { busy, error, run } = useAuthSubmit(async () => {
    // The field already shows these; don't send a registration bound to fail
    const blocked =
      username.status === "taken"
        ? `“${username.value}” is already taken. Pick another username.`
        : username.status === "invalid"
          ? username.code === "rejected"
            ? username.message
            : `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`
          : null;
    if (blocked) {
      userNameInput.current?.focus();
      return blocked;
    }
    try {
      await api.post("/auth/register", form);
    } catch (e) {
      // Someone registered this name after it was checked: say so, and check again for suggestions
      if (e.response?.status === 409 && e.response.data?.errors?.[0]?.reason === "username_taken") {
        username.recheck();
        userNameInput.current?.focus();
        return "Someone just took that username. Pick another one.";
      }
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
      <div className="space-y-6">
        <OAuthButtons providers={providers} onSelect={(provider) => window.location.assign(oauthStartUrl(provider))} />
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormError message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <TextInput value={form.fullName} onChange={set("fullName")} autoComplete="name" required autoFocus />
            </Field>
            <UsernameField
              value={form.userName}
              onChange={(userName) => setForm({ ...form, userName })}
              availability={username}
              onPick={pickUserName}
              inputRef={userNameInput}
            />
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
      </div>
    </AuthShell>
  );
}
