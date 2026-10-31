import { useState } from "react";
import { api, errMsg } from "../api";
import { TextInput } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";

/**
 * Asks for a fresh verification link. Works signed out, since unverified
 * accounts cannot sign in. Pass `email` to skip the field when it is known.
 */
export function ResendVerification({ email: knownEmail = "", className }) {
  const [email, setEmail] = useState(knownEmail);
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  const send = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await api.post("/auth/resend-email-verification", { email: email.trim() });
      setStatus("sent");
    } catch (err) {
      setError(errMsg(err));
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <p role="status" className={`text-sm text-subtle-foreground ${className || ""}`}>
        If <span className="font-medium text-foreground">{email.trim()}</span> still needs verifying, a new link is on
        its way. It works for one hour. Check your spam folder too.
      </p>
    );
  }

  return (
    <form onSubmit={send} className={`space-y-2 ${className || ""}`} noValidate>
      {!knownEmail && (
        <TextInput
          type="email"
          aria-label="Your email"
          placeholder="Your email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Button type="submit" variant="soft" className="w-full" disabled={status === "sending" || !email.trim()}>
        {status === "sending" ? "Sending" : "Send a new verification link"}
      </Button>
    </form>
  );
}
