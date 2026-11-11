import { cn } from "@/lib/utils";

/**
 * The page heading on listing pages: a left-aligned title, an optional
 * mono `meta` pill beside it ("8 open · 24 done"), a muted lead and an
 * optional `action` on the right.
 */
export function PageTitle({ title, meta, action, children, className }) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] leading-9 font-semibold tracking-tight sm:text-[32px] sm:leading-10">{title}</h1>
          {meta != null && <MetaPill>{meta}</MetaPill>}
        </div>
        {children && <p className="max-w-3xl text-[15px] text-muted-foreground">{children}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** A small mono pill for counts next to a heading. */
export function MetaPill({ className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 font-mono text-[11px] font-medium text-subtle-foreground tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A section heading with an optional icon, and an action on the right. */
export function SectionTitle({ title, icon: Icon, action, children, className }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="flex items-center gap-2 text-lg leading-7 font-semibold">
          {Icon && <Icon className="size-[18px] text-highlight" aria-hidden="true" />}
          {title}
        </h2>
        {children && <p className="mt-0.5 text-sm text-muted-foreground">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/** A white panel with a heading row: the Stitch dashboard card. */
export function Panel({ title, icon, action, description, className, children }) {
  return (
    <section className={cn("surface-card flex flex-col gap-4 p-5 hover:border-border sm:p-6", className)}>
      {title && (
        <SectionTitle title={title} icon={icon} action={action}>
          {description}
        </SectionTitle>
      )}
      {children}
    </section>
  );
}

/** A quiet placeholder for empty lists. */
export function EmptyState({ icon: Icon, title, children, action, className }) {
  return (
    <div className={cn("surface-card flex flex-col items-center px-6 py-12 text-center hover:border-border", className)}>
      {Icon && (
        <span className="grid size-10 place-items-center rounded-lg border border-border bg-secondary text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <p className="mt-3 font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
