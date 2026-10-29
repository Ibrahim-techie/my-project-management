import { cn } from "@/lib/utils";

/** The centred page title and lead used on listing pages. */
export function PageTitle({ title, children, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      <h1 className="text-2xl font-medium tracking-tight sm:text-center sm:text-3xl">{title}</h1>
      {children && (
        <p className="mx-auto max-w-3xl text-base text-subtle-foreground sm:text-center sm:text-lg">
          {children}
        </p>
      )}
    </div>
  );
}

/** A section heading with an optional action on the right. */
export function SectionTitle({ title, action, children, className }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-xl font-medium sm:text-2xl">{title}</h2>
        {children && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/** A quiet placeholder for empty lists. */
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
      {Icon && <Icon className="size-8 text-muted-foreground" aria-hidden="true" />}
      <p className="mt-3 font-montserrat font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
