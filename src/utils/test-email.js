// Checks the mail setup and sends one test email.
//   npm run mail:test               -> sends to SMTP_USER (your own sender mailbox)
//   npm run mail:test -- a@b.com    -> sends to that address
//   npm run mail:test -- --verify   -> only checks the connection, sends nothing
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const { sendVerificationEmail, verifyMailTransport } = await import("../controllers/email.controller.js");

const arg = process.argv[2];
const ready = await verifyMailTransport();
if (!ready || arg === "--verify") process.exit(ready ? 0 : 1);

const to = arg || process.env.EMAIL_SENDER_ADDRESS || process.env.SMTP_USER;
const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "") || "http://localhost:5173";

try {
  const info = await sendVerificationEmail({
    email: to,
    userName: "there",
    verificationLink: `${frontendUrl}/verify-email/test-link`,
  });

  console.log(`Test email sent to ${to}`);
  if (info?.messageId) console.log("Message ID:", info.messageId);
  if (info?.accepted) console.log("Accepted:", info.accepted);
  process.exit(0);
} catch (error) {
  console.error("Failed to send the test email:", error.message);
  process.exit(1);
}
