const express = require('express');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const requireAuth = require('../middlewares/requireAuth');
const { isValid } = require('../utils/validators');
const { cookieOptions, setAuthCookie } = require('../utils/authCookie');

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
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    setAuthCookie(res, user.id);
    res.json({ id: user.id, email: user.email });
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.status(204).end();
  });

  router.get('/me', requireAuth, async (req, res) => {
    const user = await users.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json(user);
  });

  return router;
};