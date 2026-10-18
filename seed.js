const bcrypt = require('bcryptjs');
const db = require('./db');
const { runStaleCheck } = require('./jobs');

const DEMO_EMAIL = 'demo@example.com';
const DEMO_PASSWORD = 'demo-password-123';

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function dateTime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

const demoApplications = [
  { company: 'Northwind Software', position: 'Backend Intern', status: 'applied', sentDaysAgo: 12 },
  { company: 'Contoso Labs', position: 'Junior Node.js Developer', status: 'interview', sentDaysAgo: 9 },
  { company: 'Fabrikam Systems', position: 'DevOps Intern', status: 'applied', sentDaysAgo: 3 },
  { company: 'Tailspin Apps', position: 'QA Intern', status: 'rejected', sentDaysAgo: 20 },
  { company: 'Adventure Works', position: 'Software Engineer Intern', status: 'offer', sentDaysAgo: 15 },
  { company: 'Wingtip Data', position: 'Junior Backend Developer', status: 'applied', sentDaysAgo: 1 },
];

let user = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);

if (!user) {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const insert = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(DEMO_EMAIL, passwordHash);
  user = { id: insert.lastInsertRowid };
}

db.prepare('DELETE FROM applications WHERE user_id = ?').run(user.id);

const insertApplication = db.prepare(
  `INSERT INTO applications (user_id, company, position, status, date_sent, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

for (const item of demoApplications) {
  const sent = daysAgo(item.sentDaysAgo);
  insertApplication.run(
    user.id,
    item.company,
    item.position,
    item.status,
    dateOnly(sent),
    dateTime(sent),
    dateTime(sent)
  );
}

runStaleCheck();

console.log(`Demo data ready. Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);