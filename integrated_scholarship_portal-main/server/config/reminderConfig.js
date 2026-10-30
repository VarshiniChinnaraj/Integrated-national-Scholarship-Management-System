/**
 * Scholarship Deadline Reminder Configuration
 * Adjust these values to change reminder timing without touching application logic.
 *
 * All times are in IST (UTC+5:30) unless overridden via environment variables.
 */

const reminderConfig = {
  /**
   * Timezone used for all date calculations.
   * Must be a valid IANA timezone string.
   */
  timezone: process.env.REMINDER_TIMEZONE || 'Asia/Kolkata',

  /**
   * Cron expression for how often the scheduler checks for upcoming deadlines.
   * Default: every hour at minute 0.
   * Format: minute hour day month weekday
   */
  schedulerCron: process.env.REMINDER_CRON || '0 * * * *',

  /**
   * Reminder intervals in milliseconds before the scholarship deadline.
   * Each entry defines one reminder type.
   *
   *  - intervalMs: How many ms before the deadline this reminder is sent.
   *  - type: Unique type key used for deduplication in the ReminderLog model.
   *  - label: Human-readable label included in email content.
   */
  reminders: [
    {
      type: 'REMINDER_48H',
      label: '2 Days Before Deadline',
      intervalHours: 48,
      intervalMs: 48 * 60 * 60 * 1000, // 48 hours
      deadlineDayOnly: false
    },
    {
      type: 'REMINDER_24H',
      label: '1 Day Before Deadline',
      intervalHours: 24,
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours
      deadlineDayOnly: false
    },
    {
      type: 'REMINDER_MORNING',
      label: 'Deadline Day — Morning Reminder',
      intervalHours: parseInt(process.env.REMINDER_MORNING_HOURS || '8', 10),
      intervalMs: parseInt(process.env.REMINDER_MORNING_HOURS || '8', 10) * 60 * 60 * 1000, // Configurable morning reminder
      deadlineDayOnly: true
    },
    {
      type: 'REMINDER_FINAL',
      label: 'Deadline Day — Final Reminder',
      intervalHours: parseInt(process.env.REMINDER_FINAL_HOURS || '2', 10),
      intervalMs: parseInt(process.env.REMINDER_FINAL_HOURS || '2', 10) * 60 * 60 * 1000, // Configurable final hours reminder
      deadlineDayOnly: true
    }
  ],

  /**
   * Window in ms within which a reminder is considered "due".
   * Default: 65 minutes.
   */
  windowMs: parseInt(process.env.REMINDER_WINDOW_MINUTES || '65', 10) * 60 * 1000,

  /**
   * Maximum retry attempts for failed email sends.
   */
  maxRetries: 3,

  /**
   * Whether to skip reminders for scholarships that the student has
   * already submitted an application for.
   * Set to false if you want to remind regardless.
   */
  skipIfApplied: true,

  /**
   * Minimum profile completeness required to send a reminder.
   * Students with incomplete profiles may not be eligible.
   * Set to 0 to send to all students regardless.
   */
  minProfileFields: ['email', 'name'] // Required fields to attempt a reminder
};

module.exports = reminderConfig;
