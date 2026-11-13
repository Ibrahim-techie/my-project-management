import { ArrowRight, BellRing, Eye, EyeOff, KanbanSquare, ShieldCheck } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/brand'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input';

/* What the app actually does, for the panel beside the form */
const FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Live Kanban boards',
    body: 'Drag tasks across To do, In progress and Done. Everyone on the project sees changes the moment they happen.',
  },
  {
    icon: BellRing,
    title: 'Deadlines with reminders',
    body: 'Give tasks and subtasks a due date, and assignees get an email when it is close.',
  },
  {
    icon: ShieldCheck,
    title: 'Roles and invites',
    body: 'Invite teammates by email as admins, project admins or members, each with the right permissions.',
  },
]

/**
 * The sign-in layout from the Stitch design: the form on the left, a navy
 * panel with the product's features on the right (from lg up).
 */
export function AuthShell({
  title,
  description,
  children,
  below,
  homeHref = '/'
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-sidebar px-5 sm:px-8">
        <Brand to={homeHref} />
        <ThemeSwitcher />
      </header>
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <main className="flex flex-col justify-center bg-sidebar px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <h1 className="text-[28px] leading-9 font-medium sm:text-[34px] sm:leading-[42px]">{title}</h1>
            {description && <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {below && <p className="mt-8 text-sm text-muted-foreground">{below}</p>}
          </div>
        </main>
        <aside
          aria-label="About CAMP"
          className="relative hidden overflow-hidden bg-[#0f172a] lg:flex lg:flex-col lg:justify-end">
          <img
            src="/brand/auth-hero.webp"
            alt=""
            aria-hidden="true"
            decoding="async"
            className="absolute inset-0 size-full object-cover opacity-80" />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-[#0b1120] via-[#0b1120]/55 to-transparent" />
          <div className="relative space-y-3 p-10 xl:p-14">
            <p className="section-label text-slate-400">Built for project teams</p>
            {FEATURES.map(({ icon: Icon, title: t, body }) => (
              <div
                key={t}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#2563eb]/25 text-blue-200">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-white">{t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-sidebar px-5 py-4 text-xs text-muted-foreground sm:px-8">
        <span>© {new Date().getFullYear()} CAMP</span>
        <span>Your session is encrypted</span>
      </footer>
    </div>
  );
}

/** A text link in auth copy, in the interactive cobalt. */
export function AuthLink({
  className,
  ...props
}) {
  return (
    <Link
      className={cn(
        'font-medium text-highlight underline-offset-4 transition-colors duration-200 hover:underline focus-visible:underline',
        className
      )}
      {...props} />
  );
}

/** The shared Field, re-exported so the auth pages import from one place. */
export { Field }

export function TextInput(props) {
  return <Input {...props} className={cn('h-10', props.className)} />;
}

/** A password box with a show and hide toggle. */
export function PasswordInput(props) {
  const [shown, setShown] = React.useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={shown ? 'text' : 'password'}
        className={cn('h-10 pr-10', props.className)} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
        {shown ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

/** The one solid button on the page. Shows `busyLabel` while the request runs. */
export function SubmitButton({
  busy,
  busyLabel,
  children
}) {
  return (
    <Button
      type="submit"
      variant="solid"
      size="lg"
      iconRight={busy ? null : <ArrowRight className="size-4" />}
      className="h-11 w-full"
      disabled={busy}
      aria-busy={busy || undefined}>
      {busy ? busyLabel : children}
    </Button>
  );
}

/** The form-level error, announced when it appears. */
export function FormError({
  message
}) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/35 bg-danger/8 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

const providerMeta = {
  google: {
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
        <path
          fill="#4285F4"
          d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81Z" />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z" />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1Z" />
        <path
          fill="#EA4335"
          d="M12 4.76c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.87 8.87 4.76 12 4.76Z" />
      </svg>
    ),
  },
  github: {
    label: 'GitHub',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="size-4">
        <path
          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
}

/**
 * Sign in with Google or GitHub, in the toolbar field's boxed style so they
 * stay quieter than the solid submit button.
 */
export function OAuthButtons({
  providers,
  onSelect,
  verb = 'Continue'
}) {
  const [pending, setPending] = React.useState(null)

  // Coming back with the Back button can restore this page as it was left,
  // with the button still saying it is opening the provider
  React.useEffect(() => {
    const reset = (e) => e.persisted && setPending(null)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  const known = providers.filter((p) => providerMeta[p])
  if (!known.length) return null
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {known.map((p) => (
          <button
            key={p}
            type="button"
            disabled={pending !== null}
            aria-busy={pending === p || undefined}
            onClick={() => {
              setPending(p)
              onSelect(p)
            }}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-input-bg text-sm font-medium shadow-[var(--shadow-card)] transition-colors duration-150 outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default disabled:opacity-60 pointer-coarse:h-11">
            {providerMeta[p].icon}
            {pending === p ? `Opening ${providerMeta[p].label}` : `${verb} with ${providerMeta[p].label}`}
          </button>
        ))}
      </div>
      <div
        className="section-label flex items-center gap-3"
        aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        Or continue with email
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

const OAUTH_ERRORS = {
  cancelled: (p) => `Signing in with ${p} was cancelled.`,
  expired: (p) => `Signing in with ${p} took too long or was started in another tab. Please try again.`,
  unverified_email: (p) => `Your ${p} account has no verified email address, so it can't be used to sign in.`,
  unavailable: (p) => `Signing in with ${p} isn't available right now.`,
  failed: (p) => `We couldn't sign you in with ${p}. Please try again.`,
}

/** The message for an `oauth_error` the server sent back to /login. */
export function oauthErrorMessage(reason, provider) {
  if (!reason) return null
  const label = providerMeta[provider]?.label || 'that account'
  return (OAUTH_ERRORS[reason] || OAUTH_ERRORS.failed)(label)
}

/**
 * Runs a submit handler with a busy flag and a form-level error. Without a
 * handler it says so, rather than pretending to sign anyone in.
 */
export function useAuthSubmit(handler) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState(null)
  const run = async () => {
    setError(null)
    if (!handler) {
      setError(
        'This form is not connected yet. Pass onSubmit to wire it to your auth provider.'
      )
      return false
    }
    setBusy(true)
    try {
      const message = await handler()
      if (message) {
        setError(message)
        return false
      }
      return true
    } catch {
      setError('Something went wrong. Please try again.')
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run, fail: setError }
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
