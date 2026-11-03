import { Router } from "express";
import { timingSafeEqual } from "crypto";
import asynchandler from "../utils/asynchandler.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { runDeadlineReminders } from "../jobs/deadline-reminders.js";

const router = Router();

const secretMatches = (given) => {
  const expected = process.env.CRON_SECRET;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

// For an external scheduler (cron-job.org, GitHub Actions, Render cron) on
// hosts that put the server to sleep between requests. Send the CRON_SECRET
// value in the x-cron-secret header. Disabled when CRON_SECRET is not set.
router.post(
  "/run",
  asynchandler(async (req, res) => {
    if (!process.env.CRON_SECRET) throw new ApiError(404, "Not found");
    if (!secretMatches(req.get("x-cron-secret"))) throw new ApiError(401, "Invalid cron secret");

    const result = await runDeadlineReminders();
    return res.status(200).json(new ApiResponse(200, "Deadline reminders processed", result));
  }),
);

export default router;
