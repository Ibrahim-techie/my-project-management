import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

import {
  mailGenerator,
  emailVerificationContentGenerator,
  forgotPasswordEmailContentGenerator,
  emailProjectInviteContentGenerator,
  taskAssignedContentGenerator,
  subtaskAddedContentGenerator,
  deadlineReminderContentGenerator,
} from "../utils/mail.js";

const SENDER_NAME = process.env.EMAIL_SENDER_NAME || "Project Camp";
const SENDER_EMAIL = process.env.EMAIL_SENDER_ADDRESS || process.env.SMTP_USER;
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

// 1. Configure Nodemailer, used when no Brevo key is set (local development).
// Short timeouts so a blocked SMTP port fails in seconds instead of hanging.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

// Brevo's HTTPS API. Hosts such as Render's free tier block outbound SMTP
// ports, but ordinary HTTPS gets through.
const sendWithBrevo = async ({ to, subject, html, text }) => {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Brevo rejected the email (${res.status}): ${body.message || res.statusText}`);
  }
  return body;
};

// 2. Reusable email-sending function
// `text` overrides the generated plain-text version when given
const sendEmail = async ({ to, subject, mailgenContent, text: plainText }) => {
  const html = mailGenerator.generate(mailgenContent);

  const text = plainText || mailGenerator.generatePlaintext(mailgenContent);

  if (process.env.BREVO_API_KEY) {
    return await sendWithBrevo({ to, subject, html, text });
  }

  const info = await transporter.sendMail({
    from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
    to,
    subject,
    html,
    text,
  });

  return info;
};

// 3. Send email verification email
const sendVerificationEmail = async ({ email, userName, verificationLink }) => {
  const mailgenContent = emailVerificationContentGenerator(
    userName,
    verificationLink,
  );

  return await sendEmail({
    to: email,
    subject: "Verify Your Email Address",
    mailgenContent,
  });
};

// 4. Send forgot password email
const sendPasswordResetEmail = async ({ email, userName, resetLink }) => {
  const mailgenContent = forgotPasswordEmailContentGenerator(
    userName,
    resetLink,
  );

  return await sendEmail({
    to: email,
    subject: "Reset Your Password",
    mailgenContent,
  });
};

// 5. Send a project invite to a registered user
const sendProjectInviteEmail = async ({ email, userName, inviteLink, inviterName, projectName }) => {
  const mailgenContent = emailProjectInviteContentGenerator(
    userName,
    inviteLink,
    inviterName,
    projectName,
    { expiry: "7 days", buttonColor: "#08B89D" },
  );

  return await sendEmail({
    to: email,
    subject: `You're invited to join ${projectName}`,
    mailgenContent,
  });
};

// 6. Tell a member a task was assigned to them
const sendTaskAssignedEmail = async ({
  email,
  userName,
  taskLink,
  assignerName,
  projectName,
  taskTitle,
  description,
  dueDate,
  subtasks,
}) => {
  const mailgenContent = taskAssignedContentGenerator(
    userName,
    taskLink,
    assignerName,
    projectName,
    taskTitle,
    { description, dueDate, subtasks },
  );

  return await sendEmail({
    to: email,
    subject: mailgenContent.subject,
    mailgenContent,
  });
};

// 7. Tell a task's assignee a subtask was added to their task
const sendSubtaskAddedEmail = async ({
  email,
  userName,
  taskLink,
  adderName,
  projectName,
  taskTitle,
  subtaskTitle,
  dueDate,
  taskDueDate,
}) => {
  const mailgenContent = subtaskAddedContentGenerator(
    userName,
    taskLink,
    adderName,
    projectName,
    taskTitle,
    subtaskTitle,
    { dueDate, taskDueDate },
  );

  return await sendEmail({
    to: email,
    subject: mailgenContent.subject,
    mailgenContent,
  });
};

// 8. Remind someone of their tasks and subtasks due today or tomorrow
const sendDeadlineReminderEmail = async ({ email, userName, items, link }) => {
  const mailgenContent = deadlineReminderContentGenerator(userName, items, link);

  return await sendEmail({
    to: email,
    subject: mailgenContent.subject,
    mailgenContent,
    text: mailgenContent.body.plainText,
  });
};

// Deep link that opens the task's panel on the project board
const taskLinkFor = (projectId, taskId) => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
  if (!frontendUrl) return null;
  return taskId
    ? `${frontendUrl}/projects/${projectId}?task=${taskId}`
    : `${frontendUrl}/projects/${projectId}`;
};

export {
  sendDeadlineReminderEmail,
  taskLinkFor,
  sendSubtaskAddedEmail,
  sendTaskAssignedEmail,
  transporter,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendProjectInviteEmail,
};
