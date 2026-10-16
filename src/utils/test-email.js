import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { sendVerificationEmail } = await import(
"../controllers/email.controller.js"
);

try {
  const info = await sendVerificationEmail({
    email: process.env.SMTP_USER,
    name: "Ibrahim",
    verificationLink: "http://inkpages.vercel.app",
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("Accepted:", info.accepted);
} catch (error) {
  console.error("Failed to send email:", error);
}