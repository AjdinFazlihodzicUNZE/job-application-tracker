const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/applications', (req, res) => {
  const { company, position, date_sent } = req.body;

  if (!company || !position || !date_sent) {
    return res.status(400).json({ error: 'company, position and date_sent are required' });
  }

  const result = db
    .prepare('INSERT INTO applications (company, position, date_sent) VALUES (?, ?, ?)')
    .run(company, position, date_sent);

  const saved = db
    .prepare('SELECT * FROM applications WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(saved);
});

app.get('/applications', (req, res) => {
  const rows = db.prepare('SELECT * FROM applications').all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


