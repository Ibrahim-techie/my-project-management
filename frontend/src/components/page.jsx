import { cn } from "@/lib/utils";

/**
 * The page heading on listing pages: a left-aligned title, an optional
 * mono `meta` beside it ("8 open · 24 done"), a muted lead and an
 * optional `action` on the right.
 */
export function PageTitle({ title, meta, action, children, className }) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[28px] leading-9 font-medium sm:text-[32px] sm:leading-10">{title}</h1>
          {meta != null && <MetaPill>{meta}</MetaPill>}
        </div>
        {children && <p className="max-w-3xl text-[15px] text-muted-foreground">{children}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Quiet mono text for counts next to a heading. */
export function MetaPill({ className, children }) {
  return (
    <span className={cn("inline-flex items-center font-mono text-xs text-muted-foreground tabular-nums", className)}>
      {children}
    </span>
  );
}

/** A section heading with an optional muted icon, and an action on the right. */
export function SectionTitle({ title, icon: Icon, action, children, className }) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base leading-6 font-medium">
          {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
          {title}
        </h2>
        {children && <p className="mt-0.5 text-[13px] leading-5 text-muted-foreground">{children}</p>}
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
      <p className="mt-3 font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
