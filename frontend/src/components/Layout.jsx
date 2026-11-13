import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CircleCheck,
  EllipsisVertical,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  UserRound,
} from "lucide-react";
import { useAuth } from "../auth.jsx";
import { api, unwrap } from "../api";
import { Brand } from "@/components/brand";
import { ProjectJump } from "@/components/project-jump";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
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
  { to: "/projects", label: "Projects", icon: FolderOpen, end: true },
  { to: "/my-tasks", label: "My tasks", icon: CircleCheck },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState(null);
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

  // Close the phone menu after navigating
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="md:grid md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-sidebar px-3 pt-3 pb-3 md:flex">
          <Brand className="h-8 px-2" />
          <SideNav projects={projects} className="mt-8 flex-1" />
          <UserCard user={user} onAccount={() => navigate("/account")} onSignOut={signOut} />
        </aside>

        <div className="min-w-0">
          {/* Desktop top bar */}
          <header className="sticky top-0 z-40 hidden h-14 items-center justify-between gap-4 border-b border-border bg-background/90 px-6 backdrop-blur-md md:flex lg:px-8">
            <ProjectJump projects={projects} className="w-full max-w-sm" />
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Button variant="solid" size="sm" asChild>
                <Link to="/projects?new=1">
                  <Plus aria-hidden="true" /> New project
                </Link>
              </Button>
            </div>
          </header>

          {/* Phone header */}
          <header className="sticky top-0 z-40 border-b border-border bg-sidebar/90 backdrop-blur-md md:hidden">
            <div className="flex h-14 items-center justify-between gap-3 px-4">
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
                    <div className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <UserAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{displayName(user)}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="soft" asChild>
                        <NavLink to="/account">Account</NavLink>
                      </Button>
                      <Button variant="soft" onClick={signOut}>
                        Sign out
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-16 sm:px-6 md:pt-8 lg:px-8">
            <Outlet context={{ projects, reloadProjects }} />
          </main>
        </div>
      </div>
    </div>
  );
}

/** The signed-in person at the foot of the sidebar, with the account menu. */
function UserCard({ user, onAccount, onSignOut }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-2">
      <UserAvatar user={user} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] leading-5 font-medium">{displayName(user)}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">@{user.userName}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <EllipsisVertical className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="min-w-52">
          <DropdownMenuLabel>
            <p className="text-sm font-medium">{displayName(user)}</p>
            <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onAccount}>
            <UserRound aria-hidden="true" /> Account
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSignOut}>
            <LogOut aria-hidden="true" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SideNav({ projects, className }) {
  const linkClass = ({ isActive }) =>
    cn(
      "relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4",
      isActive
        ? // the trail blaze: a short painted bar that marks where you are
          "bg-secondary text-foreground before:absolute before:top-2 before:left-0 before:h-4 before:w-[3px] before:rounded-full before:bg-highlight [&_svg]:text-foreground"
        : "text-subtle-foreground hover:bg-secondary/70 hover:text-foreground [&_svg]:text-muted-foreground",
    );

  return (
    <nav aria-label="Main" className={cn("flex min-h-0 flex-col gap-6", className)}>
      <div>
        <p className="section-label px-2.5 pb-2">Workspace</p>
        <ul className="space-y-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass}>
                <Icon aria-hidden="true" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-h-0 overflow-y-auto">
        <p className="section-label px-2.5 pb-2">Your projects</p>
        {projects === null ? null : projects.length === 0 ? (
          <p className="px-2.5 text-[13px] text-muted-foreground">No projects yet</p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map(({ project }) => (
              <li key={project._id}>
                <NavLink to={`/projects/${project._id}`} className={linkClass}>
                  <span
                    aria-hidden="true"
                    className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-border bg-elevated font-mono text-[10px] font-medium text-subtle-foreground"
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
