/**
 * Scholarship Deadline Reminder Scheduler
 *
 * Starts a recurring cron job that calls processScheduledReminders()
 * according to reminderConfig.schedulerCron (default: every hour).
 *
 * This module is imported once in server.js and exports startReminderScheduler().
 * The scheduler is safe to restart — duplicate prevention is handled by ReminderLog.
 */

const cron = require('node-cron');
const reminderConfig = require('../config/reminderConfig');
const { processScheduledReminders } = require('./reminderService');

let schedulerTask = null;
let isRunning = false;

/**
 * Start the reminder scheduler.
 * Should be called once from server.js after the database is connected.
 */
const startReminderScheduler = () => {
  if (schedulerTask) {
    console.log('[ReminderScheduler] Scheduler is already running. Skipping start.');
    return;
  }

  const cronExpression = reminderConfig.schedulerCron;

  if (!cron.validate(cronExpression)) {
    console.error(
      `[ReminderScheduler] Invalid cron expression: "${cronExpression}". Scheduler will not start.`
    );
    return;
  }

  console.log(
    `[ReminderScheduler] Starting scholarship deadline reminder scheduler.`
  );
  console.log(`[ReminderScheduler] Schedule: "${cronExpression}" (${describeSchedule(cronExpression)})`);
  console.log(`[ReminderScheduler] Timezone: ${reminderConfig.timezone}`);
  console.log(
    `[ReminderScheduler] Configured reminders: ${reminderConfig.reminders.map((r) => r.type).join(', ')}`
  );

  schedulerTask = cron.schedule(
    cronExpression,
    async () => {
      // Prevent overlapping runs if a previous tick is still processing
      if (isRunning) {
        console.log('[ReminderScheduler] Previous run still in progress. Skipping this tick.');
        return;
      }
      isRunning = true;
      try {
        await processScheduledReminders();
      } catch (err) {
        console.error('[ReminderScheduler] Unhandled error in scheduler tick:', err.message);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: reminderConfig.timezone
    }
  );

  console.log('[ReminderScheduler] Scholarship reminder scheduler started successfully.\n');
};

/**
 * Stop the reminder scheduler (for graceful shutdown or testing).
 */
const stopReminderScheduler = () => {
  if (schedulerTask) {
    schedulerTask.destroy();
    schedulerTask = null;
    console.log('[ReminderScheduler] Scheduler stopped.');
  }
};

/**
 * Return a human-readable description of common cron expressions.
 */
const describeSchedule = (expr) => {
  if (expr === '0 * * * *') return 'Every hour';
  if (expr === '*/30 * * * *') return 'Every 30 minutes';
  if (expr === '*/15 * * * *') return 'Every 15 minutes';
  if (expr === '0 */2 * * *') return 'Every 2 hours';
  return expr;
};

module.exports = {
  startReminderScheduler,
  stopReminderScheduler
};
