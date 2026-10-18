const {formatErrors} = require("./validation");
const express = require('express');
const db = require('./db');
const {z} = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('email is not valid'),
  password: z
    .string()
    .min(8, 'password must have at least 8 characters')
    .max(72, 'password must have at most 72 characters'),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('email is not valid'),
    password: z.string().min(1, 'password is required'),
})

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

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: formatErrors(result.error) });
  }

  const { email, password } = result.data;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  const wrongLogin = { error: 'Invalid email or password' };

  if (!user) {
    return res.status(401).json(wrongLogin);
  }

  const passwordIsCorrect = await bcrypt.compare(password, user.password_hash);

  if (!passwordIsCorrect) {
    return res.status(401).json(wrongLogin);
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000, // 1 hour
  });

  res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
});

module.exports = router;