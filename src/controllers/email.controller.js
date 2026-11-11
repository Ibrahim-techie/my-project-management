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
  passwordChangedContentGenerator,
  inviteRespondedContentGenerator,
  memberRoleChangedContentGenerator,
  memberRemovedContentGenerator,
  projectDeletedContentGenerator,
  taskDeadlineChangedContentGenerator,
} from "../utils/mail.js";

const SENDER_NAME = process.env.EMAIL_SENDER_NAME || process.env.APP_NAME || "CAMP";
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

// Fails fast with a clear message instead of an opaque transport error
const assertMailConfigured = () => {
  if (!process.env.BREVO_API_KEY && !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)) {
    throw new Error("Email is not configured: set BREVO_API_KEY, or SMTP_HOST, SMTP_USER and SMTP_PASS");
  }
  if (!SENDER_EMAIL) {
    throw new Error("Email is not configured: set EMAIL_SENDER_ADDRESS (or SMTP_USER)");
  }
};

// 2. Reusable email-sending function
// `text` overrides the plain-text version. Otherwise the generator's own
// plainText is used (Mailgen's drops tables and extra lines), then Mailgen's.
const sendEmail = async ({ to, subject, mailgenContent, text: plainText }) => {
  assertMailConfigured();
  const html = mailGenerator.generate(mailgenContent);

  const text =
    plainText || mailgenContent.body?.plainText || mailGenerator.generatePlaintext(mailgenContent);

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
  // the link lives as long as generateEmailVerificationToken allows
  const mailgenContent = emailVerificationContentGenerator(
    userName,
    verificationLink,
    { expiry: "1 hour" },
  );

  return await sendEmail({
    to: email,
    subject: mailgenContent.subject,
    mailgenContent,
  });
};

// 4. Send forgot password email
const sendPasswordResetEmail = async ({ email, userName, resetLink }) => {
  // the link lives as long as generateForgotPasswordToken allows
  const mailgenContent = forgotPasswordEmailContentGenerator(
    userName,
    resetLink,
    { expiry: "1 hour" },
  );

  return await sendEmail({
    to: email,
    subject: mailgenContent.subject,
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
    { expiry: "7 days" },
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

// 9. Notices. Each takes the recipient and the generator's options.
const sendNotice = (generator) => async ({ email, userName, ...options }) => {
  const mailgenContent = generator(userName, options);
  return await sendEmail({ to: email, subject: mailgenContent.subject, mailgenContent });
};

const sendPasswordChangedEmail = sendNotice(passwordChangedContentGenerator);
const sendInviteRespondedEmail = sendNotice(inviteRespondedContentGenerator);
const sendMemberRoleChangedEmail = sendNotice(memberRoleChangedContentGenerator);
const sendMemberRemovedEmail = sendNotice(memberRemovedContentGenerator);
const sendProjectDeletedEmail = sendNotice(projectDeletedContentGenerator);
const sendTaskDeadlineChangedEmail = sendNotice(taskDeadlineChangedContentGenerator);

/**
 * Runs an email send without holding up the request: a slow or failing mail
 * provider never delays or fails what the user did. Failures are logged.
 */
const sendInBackground = (label, send) => {
  Promise.resolve()
    .then(send)
    .catch((error) => console.error(`[mail] ${label}:`, error.message));
};

/** The display name used in emails, as elsewhere: full name, else username */
const nameOf = (user) => user?.fullName || user?.userName || "";

/**
 * Checks at startup that mail can go out, and logs the result, so a bad
 * password or blocked port shows up in the logs instead of on the first
 * signup. Never throws: the server runs either way.
 */
const verifyMailTransport = async () => {
  try {
    assertMailConfigured();
    if (process.env.BREVO_API_KEY) {
      console.log(`[mail] sending through the Brevo API as ${SENDER_EMAIL}`);
      return true;
    }
    await transporter.verify();
    console.log(`[mail] SMTP ready: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} as ${SENDER_EMAIL}`);
    return true;
  } catch (error) {
    console.error(`[mail] email is NOT working: ${error.message}`);
    return false;
  }
};

// Deep link that opens the task's panel on the project board
const taskLinkFor = (projectId, taskId) => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
  if (!frontendUrl) return null;
  return taskId
    ? `${frontendUrl}/projects/${projectId}?task=${taskId}`
    : `${frontendUrl}/projects/${projectId}`;
};

/** A page of the frontend, or null when FRONTEND_URL is not configured */
const appLinkFor = (path = "/") => {
  const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");
  return frontendUrl ? `${frontendUrl}${path}` : null;
};

export {
  sendInBackground,
  nameOf,
  appLinkFor,
  sendPasswordChangedEmail,
  sendInviteRespondedEmail,
  sendMemberRoleChangedEmail,
  sendMemberRemovedEmail,
  sendProjectDeletedEmail,
  sendTaskDeadlineChangedEmail,
  verifyMailTransport,
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
