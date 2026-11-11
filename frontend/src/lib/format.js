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

// Missing or bad dates render as nothing rather than "Invalid Date"
const isValidDate = (d) => d != null && !Number.isNaN(new Date(d).getTime());

export const shortDate = (d) =>
  isValidDate(d) ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";

export const relativeTime = (d) => {
  if (!isValidDate(d)) return "";
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return shortDate(d);
};

/** Where a task opens: its project board with the task panel up. */
export const taskHref = (t) => `/projects/${t.projectId || t.project}?task=${t._id}`;

/** The assignee comes back populated on lists and as an array from the task aggregation. */
export const assigneeOf = (task) => {
  const a = Array.isArray(task?.assignedTo) ? task.assignedTo[0] : task?.assignedTo;
  return typeof a === "object" ? a : null;
};
export const assigneeId = (task) => {
  const a = Array.isArray(task?.assignedTo) ? task.assignedTo[0] : task?.assignedTo;
  return a?._id || a || "";
};

/*
 * Deadlines are whole days. The picker sends "YYYY-MM-DD", which the backend
 * stores as midnight UTC, so read them back in UTC to get the same day in
 * every timezone.
 */
export const dueDateValue = (d) => (isValidDate(d) ? new Date(d).toISOString().slice(0, 10) : "");

/** A local calendar day as "YYYY-MM-DD", comparable with dueDateValue. */
export const localDayKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Whole days from today to a deadline (negative when past), or null without one. */
export const daysUntilDue = (d) => {
  const day = dueDateValue(d);
  return day ? Math.round((Date.parse(day) - Date.parse(localDayKey())) / 86400000) : null;
};

/**
 * How a deadline reads next to a task: its label, how urgent it is
 * ("overdue", "soon" for today or tomorrow, "later", or "done"), and the
 * full date for tooltips. Null when there is no deadline.
 */
export const dueInfo = (d, status) => {
  const day = dueDateValue(d);
  if (!day) return null;
  const days = Math.round((Date.parse(day) - Date.parse(localDayKey())) / 86400000);
  const date = new Date(d);
  const sameYear = date.getUTCFullYear() === new Date().getFullYear();
  const short = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
  const full = date.toLocaleDateString(undefined, { dateStyle: "full", timeZone: "UTC" });

  if (status === "done") return { label: `Due ${short}`, urgency: "done", full };
  if (days < 0) return { label: days === -1 ? "Overdue · yesterday" : `Overdue · ${short}`, urgency: "overdue", full };
  if (days === 0) return { label: "Due today", urgency: "soon", full };
  if (days === 1) return { label: "Due tomorrow", urgency: "soon", full };
  return { label: `Due ${short}`, urgency: "later", full };
};
