import Mailgen from "mailgen";

const mailGenerator = new Mailgen({
  theme: "salted",
  product: {
    name: "Project Camp",
    link: "https://frontend-neon-beta-90.vercel.app",
    logo: "https://yourcompany.com/logo.png",
  },
});

/**
 * Build a Mailgen-friendly email payload with sensible defaults and plain-text fallback.
 *
 * @param {string} userName - Recipient display name (optional)
 * @param {string} verificationLink - URL the user should visit
 * @param {object} [options] - Optional settings
 * @param {string} [options.buttonColor] - Hex color for action button
 * @param {string} [options.fromName] - Name shown in support line
 * @returns {object} Mailgen content object
 */
const emailVerificationContentGenerator = (
  userName,
  verificationLink,
  options = {},
) => {
  const name = userName || "";
  const buttonColor = options.buttonColor || "#2250bc";
  const fromName = options.fromName || "Project Camp Support";
  const subject = "Verify your email for Project Camp";

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro =
    "Welcome to Project Camp. Please verify your email to get started.";
  const details =
    "Verifying your email helps secure your account and enables full access to features.";
  const action = {
    instructions: "Click the button below to verify your email address.",
    button: {
      color: buttonColor,
      text: "Verify Email",
      link: verificationLink,
    },
  };
  const outro =
    "If you did not create an account, no further action is required.";
  const support = `If you need help, reply to this email or contact ${fromName}.`;
  const signature = "Thanks,\nTask Manager Team";

  const plainText = [
    greeting,
    "",
    intro,
    "",
    details,
    "",
    "Verify your email:",
    verificationLink,
    "",
    outro,
    "",
    support,
    "",
    signature,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro,
      details,
      message: action.instructions,
      action,
      outro,
      support,
      signature: "Thanks",
      plainText,
    },
  };
};

/**
 * Forgot password email content generator
 *
 * @param {string} userName - Recipient display name (optional)
 * @param {string} resetLink - Password reset URL
 * @param {object} [options] - Optional settings
 * @param {string} [options.buttonColor] - Hex color for action button
 * @param {string} [options.expiry] - Human-friendly expiry note (e.g., "24 hours")
 * @param {string} [options.fromName] - Support contact name
 * @returns {object} Mailgen content object
 */
const forgotPasswordEmailContentGenerator = (
  userName,
  resetLink,
  options = {},
) => {
  const name = userName || "";
  const buttonColor = options.buttonColor || "#bc6f22";
  const expiryNote = options.expiry
    ? `This link expires in ${options.expiry}.`
    : "";
  const fromName = options.fromName || "Project Camp Support";
  const subject = "Reset your Project Camp password";

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro = "We received a request to reset your password.";
  const details =
    "If you requested a password reset, click the button below to choose a new password.";
  const action = {
    instructions: "Click the button below to reset your password.",
    button: {
      color: buttonColor,
      text: "Reset Password",
      link: resetLink,
    },
  };
  const outro =
    "If you did not request a password reset, you can safely ignore this message.";
  const support = `If you have questions, reply to this email or contact ${fromName}.`;
  const signature = "Thanks,\nProject Camp Team";

  const plainText = [
    greeting,
    "",
    intro,
    "",
    details,
    "",
    "Reset your password:",
    resetLink,
    "",
    expiryNote,
    "",
    outro,
    "",
    support,
    "",
    signature,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro,
      details,
      message: action.instructions,
      action,
      outro,
      support,
      signature: "Thanks",
      plainText,
    },
  };
};

/**
 * Project invite email content generator
 *
 * @param {string} userName - Recipient display name (optional)
 * @param {string} inviteLink - URL to accept the invite
 * @param {string} admin - Name of the inviter
 * @param {string} projectName - Project name
 * @param {object} [options] - Optional settings
 * @param {string} [options.buttonColor] - Hex color for action button
 * @param {string} [options.expiry] - Human-friendly expiry note (e.g., "7 days")
 * @param {string} [options.fromName] - Support contact name
 * @returns {object} Mailgen content object
 */
const emailProjectInviteContentGenerator = (
  userName,
  inviteLink,
  admin,
  projectName,
  options = {},
) => {
  const name = userName || "";
  const inviter = admin || "A team member";
  const project = projectName || "a project";
  const buttonColor = options.buttonColor || "#bc6f22";
  const expiryNote = options.expiry
    ? `This invitation will expire in ${options.expiry}.`
    : "";
  const fromName = options.fromName || inviter;
  const subject = `Invitation to join ${project}`;

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro = `${inviter} invited you to join the project "${project}".`;
  const details =
    "Joining will give you access to the project's workspace, tasks, and collaboration tools.";
  const action = {
    instructions:
      "To accept the invitation and join the project, click the button below.",
    button: {
      color: buttonColor,
      text: "Accept Invitation",
      link: inviteLink,
    },
  };
  const outro =
    "If you do not want to join, you can ignore this message and no action is required.";
  const support = `If you have questions, reply to this email or contact ${fromName}.`;
  const signature = "Thanks,\nProject Camp Team";

  const plainText = [
    greeting,
    "",
    intro,
    "",
    details,
    "",
    "Accept the invite:",
    inviteLink,
    "",
    expiryNote,
    "",
    outro,
    "",
    support,
    "",
    signature,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro,
      details,
      message: action.instructions,
      action,
      outro,
      support,
      signature: "Thanks",
      plainText,
    },
  };
};

const STATUS_TEXT = { todo: "To do", in_progress: "In progress", done: "Done" };

const toValidDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Deadlines are whole days stored as midnight UTC, so format them in UTC
const shortDeadline = (date) =>
  toValidDate(date)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) ?? null;

/** "Thursday, 5 November 2026 (in 2 days)", or null when there is no deadline */
const formatDeadline = (date) => {
  const d = toValidDate(date);
  if (!d) return null;
  const label = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - today) / 86400000);
  const when =
    days < 0 ? "overdue" : days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return `${label} (${when})`;
};

/**
 * Task assigned email content generator
 *
 * @param {string} userName - Assignee display name (optional)
 * @param {string} taskLink - URL of the project board holding the task
 * @param {string} assignerName - Name of the admin who assigned it
 * @param {string} projectName - Project name
 * @param {string} taskTitle - Title of the assigned task
 * @param {object} [options] - Optional settings
 * @param {string} [options.buttonColor] - Hex color for action button
 * @param {string} [options.description] - Task description, shown when present
 * @param {Date|string} [options.dueDate] - Task deadline, shown when present
 * @param {Array<{title: string, status?: string, dueDate?: Date|string}>} [options.subtasks]
 *   - Subtasks already on the task (e.g. when it is reassigned)
 * @returns {object} Mailgen content object
 */
const taskAssignedContentGenerator = (
  userName,
  taskLink,
  assignerName,
  projectName,
  taskTitle,
  options = {},
) => {
  const name = userName || "";
  const assigner = assignerName || "A project admin";
  const project = projectName || "your project";
  const title = taskTitle || "a task";
  const buttonColor = options.buttonColor || "#08B89D";
  const deadline = formatDeadline(options.dueDate);
  const subtasks = options.subtasks || [];
  const subject = deadline
    ? `New task assigned: ${title} (due ${shortDeadline(options.dueDate)})`
    : `New task assigned: ${title}`;

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro = `${assigner} assigned you the task "${title}" in "${project}".`;
  const deadlineLine = deadline
    ? `Deadline: ${deadline}. Please plan to finish it by then.`
    : "This task has no deadline yet.";
  const details = options.description
    ? `Task details: ${options.description}`
    : "Open the project to see the task details, subtasks and attachments.";
  const dictionary = {
    Project: project,
    Task: title,
    "Assigned by": assigner,
    Deadline: deadline || "No deadline",
    ...(subtasks.length > 0 && { Subtasks: String(subtasks.length) }),
  };
  const table =
    subtasks.length > 0
      ? {
          title: "Subtasks",
          data: subtasks.map((s) => ({
            Subtask: s.title,
            Status: STATUS_TEXT[s.status] || "To do",
            Deadline: shortDeadline(s.dueDate) || "None",
          })),
        }
      : undefined;
  const action = {
    instructions: "Click the button below to open the task in Project Camp.",
    button: {
      color: buttonColor,
      text: "View Task",
      link: taskLink,
    },
  };
  const outro =
    "You are receiving this because you are a member of this project.";
  const signature = "Thanks,\nProject Camp Team";

  const subtaskLines = subtasks.map(
    (s) => `- ${s.title}${s.dueDate ? ` (due ${shortDeadline(s.dueDate)})` : ""}`,
  );

  const plainText = [
    greeting,
    "",
    intro,
    deadlineLine,
    "",
    details,
    "",
    ...(subtaskLines.length > 0 ? ["Subtasks:", ...subtaskLines, ""] : []),
    "Open the task:",
    taskLink,
    "",
    outro,
    "",
    signature,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro: [intro, deadlineLine, details],
      dictionary,
      ...(table && { table }),
      action,
      outro,
      signature: "Thanks",
      plainText,
    },
  };
};

/**
 * Subtask added email content generator, sent to the assignee of the parent task
 *
 * @param {string} userName - Assignee display name (optional)
 * @param {string} taskLink - URL that opens the parent task
 * @param {string} adderName - Name of the admin who added the subtask
 * @param {string} projectName - Project name
 * @param {string} taskTitle - Title of the parent task
 * @param {string} subtaskTitle - Title of the new subtask
 * @param {object} [options] - Optional settings
 * @param {string} [options.buttonColor] - Hex color for action button
 * @param {Date|string} [options.dueDate] - Subtask deadline, shown when present
 * @param {Date|string} [options.taskDueDate] - Parent task deadline, shown when present
 * @returns {object} Mailgen content object
 */
const subtaskAddedContentGenerator = (
  userName,
  taskLink,
  adderName,
  projectName,
  taskTitle,
  subtaskTitle,
  options = {},
) => {
  const name = userName || "";
  const adder = adderName || "A project admin";
  const project = projectName || "your project";
  const task = taskTitle || "your task";
  const title = subtaskTitle || "a subtask";
  const buttonColor = options.buttonColor || "#08B89D";
  const deadline = formatDeadline(options.dueDate);
  const taskDeadline = formatDeadline(options.taskDueDate);
  const subject = deadline
    ? `New subtask on ${task}: ${title} (due ${shortDeadline(options.dueDate)})`
    : `New subtask on ${task}: ${title}`;

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro = `${adder} added the subtask "${title}" to your task "${task}" in "${project}".`;
  const deadlineLine = deadline
    ? `Deadline: ${deadline}. Please plan to finish it by then.`
    : "This subtask has no deadline of its own.";
  const dictionary = {
    Project: project,
    Task: task,
    Subtask: title,
    "Added by": adder,
    "Subtask deadline": deadline || "No deadline",
    ...(taskDeadline && { "Task deadline": taskDeadline }),
  };
  const action = {
    instructions: "Click the button below to open the task in Project Camp.",
    button: {
      color: buttonColor,
      text: "View Task",
      link: taskLink,
    },
  };
  const outro = "You are receiving this because the task is assigned to you.";
  const signature = "Thanks,\nProject Camp Team";

  const plainText = [
    greeting,
    "",
    intro,
    deadlineLine,
    taskDeadline ? `The task itself is due ${taskDeadline}.` : "",
    "",
    "Open the task:",
    taskLink,
    "",
    outro,
    "",
    signature,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro: [intro, deadlineLine],
      dictionary,
      action,
      outro,
      signature: "Thanks",
      plainText,
    },
  };
};

export {
  subtaskAddedContentGenerator,
  mailGenerator,
  emailVerificationContentGenerator,
  forgotPasswordEmailContentGenerator,
  emailProjectInviteContentGenerator,
  taskAssignedContentGenerator,
};
