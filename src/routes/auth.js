const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const requireAuth = require('../middlewares/requireAuth');
const { isValid } = require('../utils/validators');

module.exports = (db) => {
  const router = express.Router();
  const users = userModel(db);

  router.post('/register', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!isValid(email, password)) {
      return res.status(400).json({ error: 'Invalid email or password (8-72 chars)' });
    }

    const hash = await bcrypt.hash(password, 12);
    try {
      await users.create(email, hash);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already used' });
      throw err;
    }
    res.status(201).json({ message: 'User created' });
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = await users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error' });
      req.session.userId = user.id;
      res.json({ id: user.id, email: user.email });
    });
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(204).end();
    });
  });

  router.get('/me', requireAuth, async (req, res) => {
    const user = await users.findById(req.session.userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(user);
  });

  return router;
};