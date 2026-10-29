import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

import {
  mailGenerator,
  emailVerificationContentGenerator,
  forgotPasswordEmailContentGenerator,
} from "../utils/mail.js";

// 1. Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Reusable email-sending function
const sendEmail = async ({ to, subject, mailgenContent }) => {
  const html = mailGenerator.generate(mailgenContent);

  const text = mailGenerator.generatePlaintext(mailgenContent);

  const info = await transporter.sendMail({
    from: `"Task Manager" <${process.env.SMTP_USER}>`,
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

//5 Sending Email for Project member Invite to User

export {
  transporter,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
