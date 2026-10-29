import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/projects" className="text-lg font-bold text-indigo-600">
            Project Camp
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/account" className="capitalize text-slate-600 hover:text-slate-900">
              {user?.fullName || user?.userName}
            </Link>
            <button
              className="btn-ghost"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
