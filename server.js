const express = require('express');
const db = require('./db');
const {z} = require('zod');

const app = express();
const PORT = 3000;

app.use(express.json());

const applicationSchema = z.object({
    company: z.string().trim().min(1, 'company is required'),
    position: z.string().trim().min(1, 'position is required'),
    date_sent: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_sent must look like 2026-10-18'),
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/applications', (req, res) => {
  const result = applicationSchema.safeParse(req.body);

   if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({ error: 'Validation failed', details: errors });
    };

    const { company, position, date_sent } = result.data;


    const existing = db
    .prepare('SELECT id FROM applications WHERE LOWER(company) = LOWER(?) AND LOWER(position) = LOWER(?)')
    .get(company, position);

    if (existing) {
    return res.status(409).json({
      error: 'You already applied for this position at this company',
      existing_id: existing.id,
    });
    }

    const insert = db
    .prepare('INSERT INTO applications (company, position, date_sent) VALUES (?, ?, ?)')
    .run(company, position, date_sent);

    const saved = db
    .prepare('SELECT * FROM applications WHERE id = ?')
    .get(insert.lastInsertRowid);

  res.status(201).json(saved);
});

app.get('/applications', (req, res) => {
  const rows = db.prepare('SELECT * FROM applications').all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


