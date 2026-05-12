import { runWeeklyAttendanceCron } from "./services/weeklyAttendance.service.js";

// --- Cron Schedule Configuration ---
// Runs every Monday at 08:00 AM IST (02:30 UTC)
// Format: "minute hour day-of-month month day-of-week"
const WEEKLY_CRON_SCHEDULE = {
  minute: 30,
  hour: 2,        // 02:30 UTC = 08:00 AM IST
  dayOfWeek: 1,   // Monday
};

/**
 * Converts the schedule config to a human-readable label.
 */
const scheduleLabel = "Every Monday at 08:00 AM IST";

/**
 * Calculates the milliseconds until the next occurrence of the cron trigger.
 */
const msUntilNextRun = () => {
  const now = new Date();
  const next = new Date(now);

  // Advance to next Monday
  const daysUntilMonday =
    (WEEKLY_CRON_SCHEDULE.dayOfWeek - now.getUTCDay() + 7) % 7 || 7;
  next.setUTCDate(now.getUTCDate() + daysUntilMonday);
  next.setUTCHours(WEEKLY_CRON_SCHEDULE.hour, WEEKLY_CRON_SCHEDULE.minute, 0, 0);

  // If we're already past this Monday's run time, jump to next week
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 7);
  }

  const ms = next - now;
  const hoursAway = (ms / 1000 / 60 / 60).toFixed(1);
  console.log(
    `[WeeklyCron] ⏰ Next run: ${next.toUTCString()} (in ~${hoursAway}h)`
  );
  return ms;
};

/**
 * Schedules a recurring weekly cron using native setInterval / setTimeout.
 * No external cron library required — node-cron or node-schedule are NOT needed.
 *
 * Flow:
 * 1. Calculate ms until the first Monday 08:00 AM IST trigger.
 * 2. Run once via setTimeout.
 * 3. Then repeat every 7 days via setInterval.
 */
export const startWeeklyCron = () => {
  console.log(`[WeeklyCron] 📅 Scheduler initialized — ${scheduleLabel}`);

  const firstDelay = msUntilNextRun();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  setTimeout(async () => {
    await runWeeklyAttendanceCron();

    // After first run, repeat exactly every 7 days
    setInterval(async () => {
      console.log("[WeeklyCron] ▶ Running scheduled weekly digest...");
      await runWeeklyAttendanceCron();
    }, ONE_WEEK_MS);
  }, firstDelay);
};
