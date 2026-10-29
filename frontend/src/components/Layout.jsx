import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FolderKanban, LayoutDashboard, LogOut, Menu, UserRound } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { api, unwrap } from "../api";
import { Backdrop } from "@/components/backdrop";
import { Brand } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { displayName } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const reloadProjects = useCallback(
    () =>
      api
        .get("/project")
        .then((res) => setProjects(unwrap(res) || []))
        .catch(() => setProjects([])),
    [],
  );

  useEffect(() => {
    reloadProjects();
  }, [reloadProjects]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 0);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  // Close the phone menu after navigating
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  const userMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <UserAvatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{displayName(user)}</p>
          <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/account")}>
          <UserRound aria-hidden="true" /> Account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-dvh">
      <Backdrop />
      <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-sidebar px-4 py-5 md:flex">
          <Brand className="px-2" />
          <SideNav projects={projects} className="mt-8 flex-1" />
          <div className="flex items-center gap-3 border-t border-border px-2 pt-4">
            {userMenu}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName(user)}</p>
              <p className="truncate text-xs text-muted-foreground">@{user.userName}</p>
            </div>
            <ThemeSwitcher />
          </div>
        </aside>

        <div className="min-w-0">
          <header
            className={cn(
              "sticky top-0 z-40 transition-[backdrop-filter,background] duration-300 md:hidden",
              scrolled ? "border-b border-border bg-sidebar/80 backdrop-blur-md" : "bg-transparent",
            )}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Brand />
              <div className="flex items-center gap-1">
                <ThemeSwitcher />
                <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
                  <DrawerTrigger asChild>
                    <IconButton variant="ghost" aria-label="Open menu">
                      <Menu aria-hidden="true" />
                    </IconButton>
                  </DrawerTrigger>
                  <DrawerContent side="left" title="Menu" className="w-[85vw] max-w-xs bg-sidebar">
                    <SideNav projects={projects} className="flex-1" />
                    <div className="flex items-center gap-3 border-t border-border pt-4">
                      <UserAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{displayName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NavLink to="/account" className="rounded-lg border border-border px-3 py-2 text-center text-sm hover:bg-secondary">
                        Account
                      </NavLink>
                      <button onClick={signOut} className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
                        Sign out
                      </button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-8 md:pt-10 lg:px-12">
            <Outlet context={{ projects, reloadProjects }} />
          </main>
        </div>
      </div>
    </div>
  );
}

function SideNav({ projects, className }) {
  const linkClass = ({ isActive }) =>
    cn(
      "group/nav relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      isActive
        ? "bg-accent font-medium text-foreground [&_svg]:text-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-gradient"
        : "text-subtle-foreground hover:bg-secondary/70 hover:text-foreground",
    );

  return (
    <nav aria-label="Main" className={cn("flex min-h-0 flex-col gap-6", className)}>
      <ul className="space-y-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={linkClass}>
              <Icon className="size-4" aria-hidden="true" /> {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="min-h-0 overflow-y-auto">
        <p className="px-2.5 pb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Your projects</p>
        {projects === null ? null : projects.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">No projects yet</p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map(({ project }) => (
              <li key={project._id}>
                <NavLink to={`/projects/${project._id}`} className={linkClass}>
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center rounded-md border border-border bg-elevated font-montserrat text-[10px] font-semibold group-aria-[current=page]/nav:border-brand-teal/40 group-aria-[current=page]/nav:text-accent-foreground"
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{project.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
