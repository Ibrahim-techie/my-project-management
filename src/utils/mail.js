import Mailgen from "mailgen";

const APP_NAME = process.env.APP_NAME || "CAMP";
// The navy of the app's primary buttons
const BUTTON_COLOR = "#0f172a";

const appUrl = () => process.env.FRONTEND_URL?.replace(/\/+$/, "") || "http://localhost:5173";

// Built per email rather than at import time, so FRONTEND_URL is read after
// .env has loaded. No logo image: the header shows the product name instead.
const createMailGenerator = () =>
  new Mailgen({
    theme: "salted",
    product: { name: APP_NAME, link: appUrl() },
  });

const mailGenerator = {
  generate: (content) => createMailGenerator().generate(content),
  generatePlaintext: (content) => createMailGenerator().generatePlaintext(content),
};

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
  const buttonColor = options.buttonColor || BUTTON_COLOR;
  const expiryNote = options.expiry ? `This link expires in ${options.expiry}.` : "";
  const fromName = options.fromName || `${APP_NAME} Support`;
  const subject = `Verify your email for ${APP_NAME}`;

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro =
    `Welcome to ${APP_NAME}. Please verify your email to get started.`;
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
  const signature = `Thanks,\n${APP_NAME} Team`;

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

  // Mailgen renders only intro, action and outro, so the extra lines go there
  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro: [intro, details],
      action,
      outro: [expiryNote, outro, support].filter(Boolean),
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
  const buttonColor = options.buttonColor || BUTTON_COLOR;
  const expiryNote = options.expiry
    ? `This link expires in ${options.expiry}.`
    : "";
  const fromName = options.fromName || `${APP_NAME} Support`;
  const subject = `Reset your ${APP_NAME} password`;

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
  const signature = `Thanks,\n${APP_NAME} Team`;

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
      intro: [intro, details],
      action,
      outro: [expiryNote, outro, support].filter(Boolean),
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
  const buttonColor = options.buttonColor || BUTTON_COLOR;
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
  const signature = `Thanks,\n${APP_NAME} Team`;

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
      intro: [intro, details],
      action,
      outro: [expiryNote, outro, support].filter(Boolean),
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
  const buttonColor = options.buttonColor || BUTTON_COLOR;
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
    instructions: `Click the button below to open the task in ${APP_NAME}.`,
    button: {
      color: buttonColor,
      text: "View Task",
      link: taskLink,
    },
  };
  const outro =
    "You are receiving this because you are a member of this project.";
  const signature = `Thanks,\n${APP_NAME} Team`;

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
  const buttonColor = options.buttonColor || BUTTON_COLOR;
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
    instructions: `Click the button below to open the task in ${APP_NAME}.`,
    button: {
      color: buttonColor,
      text: "View Task",
      link: taskLink,
    },
  };
  const outro = "You are receiving this because the task is assigned to you.";
  const signature = `Thanks,\n${APP_NAME} Team`;

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

/**
 * Deadline reminder email content generator: one digest per person listing
 * everything of theirs that is due today or tomorrow.
 *
 * @param {string} userName - Recipient display name (optional)
 * @param {Array<{kind: "Task"|"Subtask", title: string, taskTitle?: string,
 *   projectName?: string, dueDate: Date|string}>} items - Items due soon
 * @param {string} link - Where the button goes (the task when there is one item)
 * @param {object} [options] - Optional settings
 * @param {string} [options.buttonColor] - Hex color for action button
 * @returns {object} Mailgen content object, with body.plainText listing the items
 */
const deadlineReminderContentGenerator = (userName, items, link, options = {}) => {
  const name = userName || "";
  const buttonColor = options.buttonColor || BUTTON_COLOR;
  const single = items.length === 1 ? items[0] : null;

  const whenText = (dueDate) => {
    const full = formatDeadline(dueDate) || "";
    return full.endsWith("(today)") ? "today" : full.endsWith("(tomorrow)") ? "tomorrow" : `on ${shortDeadline(dueDate)}`;
  };
  const describe = (item) =>
    item.kind === "Subtask"
      ? `subtask "${item.title}" on "${item.taskTitle}"`
      : `task "${item.title}"`;

  const subject = single
    ? `Reminder: "${single.title}" is due ${whenText(single.dueDate)}`
    : `Reminder: ${items.length} items are due soon`;

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro = single
    ? `Your ${describe(single)}${single.projectName ? ` in "${single.projectName}"` : ""} is due ${whenText(single.dueDate)}.`
    : `You have ${items.length} items due today or tomorrow.`;
  const nudge = single
    ? "If it is already finished, mark it done so the board stays up to date."
    : "If any are already finished, mark them done so the board stays up to date.";

  const table = {
    data: items.map((item) => ({
      Item: item.kind === "Subtask" ? `${item.title} (subtask of ${item.taskTitle})` : item.title,
      Project: item.projectName || "",
      Due: formatDeadline(item.dueDate),
    })),
  };

  const action = {
    instructions: single
      ? `Click the button below to open it in ${APP_NAME}.`
      : "Click the button below to see everything assigned to you.",
    button: {
      color: buttonColor,
      text: single ? "View Task" : `Open ${APP_NAME}`,
      link,
    },
  };
  const outro = "You are receiving this because these items are assigned to you.";
  const signature = `Thanks,\n${APP_NAME} Team`;

  // Mailgen's plain-text output drops tables, so list the items here
  const plainText = [
    greeting,
    "",
    intro,
    "",
    ...items.map(
      (item) =>
        `- ${item.kind === "Subtask" ? `${item.title} (subtask of ${item.taskTitle})` : item.title}` +
        `${item.projectName ? `, ${item.projectName}` : ""}: due ${formatDeadline(item.dueDate)}`,
    ),
    "",
    nudge,
    "",
    single ? "Open the task:" : `Open ${APP_NAME}:`,
    link,
    "",
    outro,
    "",
    signature,
  ].join("\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro: [intro, nudge],
      table,
      action,
      outro,
      signature: "Thanks",
      plainText,
    },
  };
};

// ---------- short notices ----------

const ROLE_TEXT = { admin: "Admin", project_admin: "Project admin", member: "Member" };
const ROLE_DETAIL = {
  admin: "Admins manage the project, its members, its notes and its tasks.",
  project_admin: "Project admins create, edit and assign tasks and subtasks.",
  member: "Members follow the project's tasks and notes and work on what is assigned to them.",
};

/** "12 November 2026, 14:05 UTC" */
const formatMoment = (date = new Date()) =>
  `${date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;

/**
 * Shared shape for short notification emails: a greeting, a few lines, an
 * optional facts list and button, and a matching plain-text version. The
 * button is left out when there is no link (FRONTEND_URL not configured).
 */
const noticeContent = ({ userName, subject, lines, dictionary, button, outro }) => {
  const name = userName || "";
  const greeting = name ? `Hi ${name},` : "Hello,";
  const signature = `Thanks,\n${APP_NAME} Team`;
  const withButton = Boolean(button?.link);

  const plainText = [
    greeting,
    "",
    ...lines,
    "",
    ...(dictionary ? Object.entries(dictionary).map(([k, v]) => `${k}: ${v}`) : []),
    "",
    ...(withButton ? [`${button.text}:`, button.link] : []),
    "",
    outro,
    "",
    signature,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return {
    subject,
    body: {
      name,
      greeting: name ? "Hi" : "Hello",
      intro: lines,
      ...(dictionary && { dictionary }),
      ...(withButton && {
        action: {
          instructions: button.instructions || "",
          button: { color: BUTTON_COLOR, text: button.text, link: button.link },
        },
      }),
      outro,
      signature: "Thanks",
      plainText,
    },
  };
};

/**
 * Security notice after a password change or reset
 *
 * @param {string} userName - Recipient display name (optional)
 * @param {object} options
 * @param {boolean} [options.reset] - true when it was reset with an emailed link
 * @param {string} [options.resetLink] - Where to go if it was not them
 * @param {Date} [options.when] - When it happened
 */
const passwordChangedContentGenerator = (userName, { reset = false, resetLink, when } = {}) =>
  noticeContent({
    userName,
    subject: `Your ${APP_NAME} password was changed`,
    lines: [
      `The password for your ${APP_NAME} account was ${
        reset ? "reset with an emailed link" : "changed from your account settings"
      } on ${formatMoment(when)}.`,
      "You were signed out everywhere, so sign in again with the new password.",
    ],
    button: {
      instructions: "If you did not make this change, reset your password now.",
      text: "Reset Password",
      link: resetLink,
    },
    outro: "If this was you, there is nothing else to do.",
  });

/**
 * Tells whoever sent an invite that it was accepted or declined
 *
 * @param {string} userName - Inviter display name (optional)
 * @param {object} options
 * @param {string} options.inviteeName - Who answered
 * @param {string} options.projectName - Project name
 * @param {boolean} options.accepted - Accepted or declined
 * @param {string} [options.role] - Role the invite granted
 * @param {string} [options.projectLink] - URL of the project
 */
const inviteRespondedContentGenerator = (
  userName,
  { inviteeName, projectName, accepted, role, projectLink } = {},
) => {
  const who = inviteeName || "Someone you invited";
  const project = projectName || "your project";
  return noticeContent({
    userName,
    subject: accepted ? `${who} joined ${project}` : `${who} declined your invite to ${project}`,
    lines: accepted
      ? [
          `${who} accepted your invite and joined "${project}"${role ? ` as ${ROLE_TEXT[role] || role}` : ""}.`,
          "You can assign them tasks now.",
        ]
      : [
          `${who} declined your invite to "${project}".`,
          "If that was a mistake, you can send a new invite from the project's Members tab.",
        ],
    button: { text: "Open Project", link: projectLink },
    outro: "You are receiving this because you sent the invite.",
  });
};

/**
 * Tells a member their role in a project changed
 *
 * @param {string} userName - Member display name (optional)
 * @param {object} options
 * @param {string} options.projectName - Project name
 * @param {string} options.role - The new role
 * @param {string} [options.changerName] - Who changed it
 * @param {string} [options.projectLink] - URL of the project
 */
const memberRoleChangedContentGenerator = (userName, { projectName, role, changerName, projectLink } = {}) => {
  const project = projectName || "a project";
  const roleText = ROLE_TEXT[role] || role;
  return noticeContent({
    userName,
    subject: `Your role in ${project} is now ${roleText}`,
    lines: [
      `${changerName || "A project admin"} changed your role in "${project}" to ${roleText}.`,
      ROLE_DETAIL[role] || "",
    ].filter(Boolean),
    button: { text: "Open Project", link: projectLink },
    outro: "You are receiving this because you are a member of this project.",
  });
};

/**
 * Tells someone they were removed from a project
 *
 * @param {string} userName - Former member display name (optional)
 * @param {object} options
 * @param {string} options.projectName - Project name
 * @param {string} [options.removerName] - Who removed them
 * @param {string} [options.appLink] - URL of the app
 */
const memberRemovedContentGenerator = (userName, { projectName, removerName, appLink } = {}) => {
  const project = projectName || "a project";
  return noticeContent({
    userName,
    subject: `You were removed from ${project}`,
    lines: [
      `${removerName || "A project admin"} removed you from "${project}".`,
      "You no longer have access to its tasks and notes. If you think this was a mistake, ask a project admin to invite you again.",
    ],
    button: { text: `Open ${APP_NAME}`, link: appLink },
    outro: "You are receiving this because you were a member of this project.",
  });
};

/**
 * Tells the members of a project that it was deleted
 *
 * @param {string} userName - Member display name (optional)
 * @param {object} options
 * @param {string} options.projectName - Project name
 * @param {string} [options.deleterName] - Who deleted it
 * @param {string} [options.appLink] - URL of the app
 */
const projectDeletedContentGenerator = (userName, { projectName, deleterName, appLink } = {}) => {
  const project = projectName || "A project";
  return noticeContent({
    userName,
    subject: `${project} was deleted`,
    lines: [
      `${deleterName || "A project admin"} deleted the project "${project}".`,
      "Its tasks, subtasks and notes were deleted with it, so nothing is waiting for you there.",
    ],
    button: { text: `Open ${APP_NAME}`, link: appLink },
    outro: "You are receiving this because you were a member of this project.",
  });
};

/**
 * Tells a task's assignee that someone set, moved or removed its deadline
 *
 * @param {string} userName - Assignee display name (optional)
 * @param {object} options
 * @param {string} options.taskTitle - Task title
 * @param {string} options.projectName - Project name
 * @param {string} [options.changerName] - Who changed it
 * @param {Date|string|null} [options.previousDueDate] - Deadline before
 * @param {Date|string|null} [options.dueDate] - Deadline now
 * @param {string} [options.taskLink] - URL that opens the task
 */
const taskDeadlineChangedContentGenerator = (
  userName,
  { taskTitle, projectName, changerName, previousDueDate, dueDate, taskLink } = {},
) => {
  const title = taskTitle || "your task";
  const project = projectName || "your project";
  const changer = changerName || "A project admin";
  const before = formatDeadline(previousDueDate);
  const after = formatDeadline(dueDate);
  return noticeContent({
    userName,
    subject: after ? `New deadline for ${title}: ${shortDeadline(dueDate)}` : `Deadline removed from ${title}`,
    lines: after
      ? [
          `${changer} ${before ? "moved" : "set"} the deadline of your task "${title}" in "${project}".`,
          `It is now due ${after}.`,
        ]
      : [`${changer} removed the deadline from your task "${title}" in "${project}".`],
    dictionary: {
      Project: project,
      Task: title,
      "Changed by": changer,
      "Previous deadline": before || "None",
      "New deadline": after || "None",
    },
    button: { text: "View Task", link: taskLink },
    outro: "You are receiving this because the task is assigned to you.",
  });
};

export {
  passwordChangedContentGenerator,
  inviteRespondedContentGenerator,
  memberRoleChangedContentGenerator,
  memberRemovedContentGenerator,
  projectDeletedContentGenerator,
  taskDeadlineChangedContentGenerator,
  deadlineReminderContentGenerator,
  subtaskAddedContentGenerator,
  mailGenerator,
  emailVerificationContentGenerator,
  forgotPasswordEmailContentGenerator,
  emailProjectInviteContentGenerator,
  taskAssignedContentGenerator,
};
