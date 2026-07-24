const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

function toPublicUser(user) {
  return { email: user.email, displayName: user.display_name };
}

router.post('/register', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (minimum 6 caracteres)' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Un compte existe deja avec cet email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const displayName = email.split('@')[0];
  const createdAt = Date.now();

  const result = db
    .prepare('INSERT INTO users (email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)')
    .run(email, passwordHash, displayName, createdAt);

  req.session.userId = result.lastInsertRowid;

  res.json(toPublicUser({ email, display_name: displayName }));
});

router.post('/login', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  req.session.userId = user.id;

  res.json(toPublicUser(user));
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  res.json(toPublicUser(user));
});

module.exports = router;
