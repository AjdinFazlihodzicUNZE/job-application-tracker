const cron = require('node-cron');
const db = require('./db');

const STALE_AFTER_DAYS = 7;

function runStaleCheck() {
  const result = db
    .prepare(
      `UPDATE applications
       SET needs_followup = 1
       WHERE status IN ('applied', 'interview')
         AND needs_followup = 0
         AND updated_at <= datetime('now', ?)`
    )
    .run(`-${STALE_AFTER_DAYS} days`);

  console.log(`Stale check done: ${result.changes} application(s) flagged for follow-up`);
  return result.changes;
}

function startJobs() {
  cron.schedule('0 8 * * *', runStaleCheck, { timezone: 'Europe/Sarajevo' });
  console.log('Daily stale check scheduled for 08:00 (Europe/Sarajevo)');
}

module.exports = { runStaleCheck, startJobs };