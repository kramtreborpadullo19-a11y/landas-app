const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/* ---- teacher signup ---- */
router.post('/signup/teacher', async (req, res) => {
  const { name, email, password, school, grade } = req.body;
  if (!name || !email || !password || !school || !grade) {
    return res.status(400).json({ error: 'Please fill in every field.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `insert into users (email, password_hash, role) values ($1,$2,'teacher') returning id`,
      [email.toLowerCase(), hash]
    );
    const id = userRes.rows[0].id;
    await client.query(
      `insert into teacher_profiles (id, name, school, grade) values ($1,$2,$3,$4)`,
      [id, name, school, grade]
    );
    await client.query('COMMIT');
    const token = signToken({ id, role: 'teacher' });
    res.json({ token, profile: { id, name, school, grade } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  } finally {
    client.release();
  }
});

/* ---- student signup ---- */
router.post('/signup/student', async (req, res) => {
  const { name, email, password, school, age, grade, section } = req.body;
  if (!name || !email || !password || !school || !age || !grade || !section) {
    return res.status(400).json({ error: 'Please fill in every field.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `insert into users (email, password_hash, role) values ($1,$2,'student') returning id`,
      [email.toLowerCase(), hash]
    );
    const id = userRes.rows[0].id;
    await client.query(
      `insert into students (id, name, age, school, grade, section) values ($1,$2,$3,$4,$5,$6)`,
      [id, name, age, school, grade, section]
    );
    await client.query('COMMIT');
    const token = signToken({ id, role: 'student' });
    res.json({ token, profile: { id, name, age, school, grade, section, style: null } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'An account with that email already exists.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating your account.' });
  } finally {
    client.release();
  }
});

/* ---- login (shared) ---- */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Please enter your email and password.' });

  try {
    const userRes = await pool.query(`select * from users where email = $1`, [email.toLowerCase()]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken(user);

    if (user.role === 'teacher') {
      const p = await pool.query(`select name, school, grade from teacher_profiles where id = $1`, [user.id]);
      return res.json({ token, role: 'teacher', profile: p.rows[0] });
    } else {
      const p = await pool.query(`select name, age, school, grade, section, style, confidence from students where id = $1`, [user.id]);
      return res.json({ token, role: 'student', profile: p.rows[0] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong logging you in.' });
  }
});

/* ---- forgot password (stub) ----
   A real implementation would email a signed, short-lived reset link and
   add a POST /reset-password route that verifies it and updates
   password_hash. Wiring an email provider (Resend, SendGrid, etc.) is the
   only piece left out here since it needs a real account + API key. */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Please enter your email.' });
  // Always respond success regardless of whether the email exists, so the
  // endpoint can't be used to check which emails are registered.
  res.json({ ok: true });
});

/* ---- current user profile ---- */
router.get('/me', requireAuth(), async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const p = await pool.query(`select name, school, grade from teacher_profiles where id = $1`, [req.user.id]);
      return res.json({ role: 'teacher', profile: p.rows[0] });
    } else {
      const p = await pool.query(`select name, age, school, grade, section, style, confidence from students where id = $1`, [req.user.id]);
      return res.json({ role: 'student', profile: p.rows[0] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load profile.' });
  }
});

module.exports = router;
