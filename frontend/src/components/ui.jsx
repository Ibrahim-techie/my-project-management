export function AuthCard({ title, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-indigo-600">Project Camp</h1>
        <p className="mb-6 text-center text-sm text-slate-500">{title}</p>
        <div className="card space-y-4">{children}</div>
        {footer && <div className="mt-4 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const cls =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-green-200 bg-green-50 text-green-700";
  return <div className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    admin: "bg-purple-100 text-purple-700",
    project_admin: "bg-blue-100 text-blue-700",
    member: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[role] || styles.member}`}>
      {role?.replace("_", " ")}
    </span>
  );
}

export function Avatar({ user }) {
  const name = user?.fullName || user?.userName || "?";
  return (
    <span
      title={name}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold uppercase text-indigo-700`}
    >
      {name.slice(0, 2)}
    </span>
  );
}
