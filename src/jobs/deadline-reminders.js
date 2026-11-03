import Task from "../models/task.models.js";
import SubTask from "../models/subtask.models.js";
import Project from "../models/project.models.js";
import User from "../models/user.models.js";
import { TaskStatusEnum } from "../utils/constants.js";
import { sendDeadlineReminderEmail, taskLinkFor } from "../controllers/email.controller.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Not done, and no reminder sent yet for the deadline it has now
const dueSoonFilter = () => {
  // Deadlines are whole days stored as midnight UTC: "today" and "tomorrow"
  // are the two midnights from the start of the current UTC day
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return {
    status: { $ne: TaskStatusEnum.DONE },
    dueDate: { $gte: today, $lte: new Date(today.getTime() + DAY_MS) },
    $expr: { $ne: ["$reminderSentFor", "$dueDate"] },
  };
};

let running = false;

/**
 * Email each assignee one digest of their open tasks and subtasks due today
 * or tomorrow. Each item is reminded once per deadline: it is marked only
 * after its email went out, so a failed send is retried on the next run.
 * Subtasks go to the assignee of their task.
 */
export const runDeadlineReminders = async () => {
  if (running) return { skipped: true };
  running = true;
  try {
    const [tasks, subtasks] = await Promise.all([
      Task.find(dueSoonFilter()).select("title project assignedTo dueDate").lean(),
      SubTask.find(dueSoonFilter())
        .select("title task dueDate")
        .populate({ path: "task", select: "title project assignedTo status" })
        .lean(),
    ]);

    // A subtask whose task is gone or already done needs no reminder
    const openSubtasks = subtasks.filter((s) => s.task && s.task.status !== TaskStatusEnum.DONE);
    if (tasks.length === 0 && openSubtasks.length === 0) return { emails: 0, items: 0 };

    const projectIds = [
      ...new Set([...tasks.map((t) => String(t.project)), ...openSubtasks.map((s) => String(s.task.project))]),
    ];
    const projects = await Project.find({ _id: { $in: projectIds } }).select("name").lean();
    const projectName = new Map(projects.map((p) => [String(p._id), p.name]));

    // Group everything by the person it is assigned to
    const byUser = new Map();
    const add = (userId, item) => {
      if (!userId) return;
      const key = String(userId);
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key).push(item);
    };
    for (const t of tasks) {
      add(t.assignedTo, {
        kind: "Task",
        id: t._id,
        model: Task,
        title: t.title,
        projectId: t.project,
        taskId: t._id,
        projectName: projectName.get(String(t.project)),
        dueDate: t.dueDate,
      });
    }
    for (const s of openSubtasks) {
      add(s.task.assignedTo, {
        kind: "Subtask",
        id: s._id,
        model: SubTask,
        title: s.title,
        taskTitle: s.task.title,
        projectId: s.task.project,
        taskId: s.task._id,
        projectName: projectName.get(String(s.task.project)),
        dueDate: s.dueDate,
      });
    }

    const users = await User.find({ _id: { $in: [...byUser.keys()] } }).select("email userName fullName").lean();
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
    if (!frontendUrl) {
      console.error("[reminders] FRONTEND_URL is not configured, skipping reminders");
      return { emails: 0, items: 0 };
    }

    let emails = 0;
    let items = 0;
    for (const user of users) {
      const list = byUser.get(String(user._id)).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      if (!user.email) continue;
      const link = list.length === 1 ? taskLinkFor(list[0].projectId, list[0].taskId) : `${frontendUrl}/`;

      try {
        await sendDeadlineReminderEmail({
          email: user.email,
          userName: user.fullName || user.userName,
          items: list,
          link,
        });
      } catch (error) {
        console.error(`[reminders] could not email user ${user._id}:`, error.message);
        continue;
      }

      await Promise.all(
        list.map((item) =>
          item.model.updateOne({ _id: item.id }, { $set: { reminderSentFor: item.dueDate } }),
        ),
      );
      emails += 1;
      items += list.length;
    }

    console.log(`[reminders] sent ${emails} reminder email(s) covering ${items} item(s)`);
    return { emails, items };
  } finally {
    running = false;
  }
};

/**
 * Check for upcoming deadlines every hour while the server is up. Set
 * DEADLINE_REMINDERS=off to disable, e.g. when an external cron calls
 * POST /api/v1/reminders/run instead.
 */
export const startDeadlineReminders = () => {
  if (process.env.DEADLINE_REMINDERS === "off") return;
  const run = () =>
    runDeadlineReminders().catch((error) => console.error("[reminders] run failed:", error.message));
  setTimeout(run, 30 * 1000).unref();
  setInterval(run, HOUR_MS).unref();
};
