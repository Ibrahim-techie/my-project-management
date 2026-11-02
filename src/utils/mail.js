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
  const subject = `New task assigned: ${title}`;

  const greeting = name ? `Hi ${name},` : "Hello,";
  const intro = `${assigner} assigned you the task "${title}" in "${project}".`;
  const details = options.description
    ? `Task details: ${options.description}`
    : "Open the project to see the task details, subtasks and attachments.";
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

  const plainText = [
    greeting,
    "",
    intro,
    "",
    details,
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
      intro: [intro, details],
      action,
      outro,
      signature: "Thanks",
      plainText,
    },
  };
};

export {
  mailGenerator,
  emailVerificationContentGenerator,
  forgotPasswordEmailContentGenerator,
  emailProjectInviteContentGenerator,
  taskAssignedContentGenerator,
};
