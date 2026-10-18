const PDFDocument = require('pdfkit');
const db = require('./db');

const STATUSES = ['applied', 'interview', 'rejected', 'offer'];

function writeList(doc, rows) {
  if (rows.length === 0) {
    doc.fontSize(12).text('Nothing here.');
    return;
  }

  for (const row of rows) {
    doc.fontSize(12).text(`${row.company} - ${row.position} (sent ${row.date_sent})`);
  }
}

function createWeeklyReport(userId, output) {
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);

  const statusRows = db
    .prepare('SELECT status, COUNT(*) AS count FROM applications WHERE user_id = ? GROUP BY status')
    .all(userId);

  const recent = db
    .prepare(
      `SELECT company, position, date_sent FROM applications
       WHERE user_id = ? AND date_sent >= date('now', '-7 days')
       ORDER BY date_sent DESC`
    )
    .all(userId);

  const followups = db
    .prepare(
      `SELECT company, position, date_sent FROM applications
       WHERE user_id = ? AND needs_followup = 1
       ORDER BY date_sent`
    )
    .all(userId);

  const counts = {};
  for (const status of STATUSES) {
    counts[status] = 0;
  }
  for (const row of statusRows) {
    counts[row.status] = row.count;
  }

  const doc = new PDFDocument();
  doc.pipe(output);

  doc.fontSize(20).text('Weekly summary');
  doc.fontSize(12).text(`Account: ${user.email}`);
  doc.text(`Created: ${new Date().toISOString().slice(0, 10)}`);
  doc.moveDown();

  doc.fontSize(16).text('Applications by status');
  for (const status of STATUSES) {
    doc.fontSize(12).text(`${status}: ${counts[status]}`);
  }
  doc.moveDown();

  doc.fontSize(16).text('Sent in the last 7 days');
  writeList(doc, recent);
  doc.moveDown();

  doc.fontSize(16).text('Need a follow-up');
  writeList(doc, followups);

  doc.end();
}

module.exports = { createWeeklyReport };