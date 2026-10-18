const cron = require('node-cron');
const db = require('./db');
const fs = require('fs');
const path = require('path')
const { createWeeklyReport } = require('./report');

const STALE_AFTER_DAYS = 7;
const REPORTS_FOLDER = 'reports';

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
function runWeeklyReports() {
  fs.mkdirSync(REPORTS_FOLDER, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const users = db.prepare('SELECT id FROM users').all();

  for (const user of users) {
    const filePath = path.join(REPORTS_FOLDER, `weekly-report-user${user.id}-${today}.pdf`);
    const stream = fs.createWriteStream(filePath);

    stream.on('finish', () => console.log(`Saved ${filePath}`));

    createWeeklyReport(user.id, stream);
  }
}
function startJobs() {
  const options = { timezone: 'Europe/Sarajevo' };
   cron.schedule('0 8 * * *', runStaleCheck, options);
   cron.schedule('5 8 * * 1', runWeeklyReports, options);
   
   console.log('Scheduled: stale check daily at 08:00, weekly reports on Mondays at 08:05 (Europe/Sarajevo)');

}

module.exports = { runStaleCheck,runWeeklyReports, startJobs }; 