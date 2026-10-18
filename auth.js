const {formatErrors} = require("./validation");
const express = require('express');
const db = require('./db');
const {z} = require('zod');
const bcrypt = require('bcryptjs');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('email is not valid'),
  password: z
    .string()
    .min(8, 'password must have at least 8 characters')
    .max(72, 'password must have at most 72 characters'),
});

router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: formatErrors(result.error) });
  }

  const { email, password } = result.data;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const insert = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email, passwordHash);

  res.status(201).json({ id: insert.lastInsertRowid, email });
});

module.exports = router;