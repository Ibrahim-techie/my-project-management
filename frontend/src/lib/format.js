import { ROLES } from "../api";

export const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" };

export const ROLE_LABEL = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.PROJECT_ADMIN]: "Project admin",
  [ROLES.MEMBER]: "Member",
};

/** The backend stores full names in lowercase, so title-case them for display. */
export const displayName = (user) =>
  (user?.fullName || user?.userName || "Unknown")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const initials = (user) =>
  displayName(user)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const shortDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export const relativeTime = (d) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return shortDate(d);
};

/** The assignee comes back populated on lists and as an array from the task aggregation. */
export const assigneeOf = (task) => {
  const a = Array.isArray(task?.assignedTo) ? task.assignedTo[0] : task?.assignedTo;
  return typeof a === "object" ? a : null;
};
export const assigneeId = (task) => {
  const a = Array.isArray(task?.assignedTo) ? task.assignedTo[0] : task?.assignedTo;
  return a?._id || a || "";
};
