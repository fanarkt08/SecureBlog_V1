const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const app = express();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(express.static('public', { extensions: ['html'] }));
app.get('/', (req, res) => res.redirect('/login'));

const isValid = (email, password) =>
  typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email) &&
  typeof password === 'string' && password.length >= 8 && password.length <= 72;

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isValid(email, password)) return res.status(400).json({ error: 'Invalid email or password (8-72 chars)' });

  const hash = await bcrypt.hash(password, 12);
  try {
    await db.execute('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, hash]);
  } catch (err) {
    throw err;
  }
  res.status(201).json({ message: 'User created' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Invalid credentials' });

  const [rows] = await db.execute('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Session error' });
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email });
  });
});

const requireAuth = (req, res, next) =>
  req.session.userId ? next() : res.status(401).json({ error: 'Not authenticated' });

app.get('/api/me', requireAuth, async (req, res) => {
  const [rows] = await db.execute('SELECT id, email, created_at FROM users WHERE id = ?', [req.session.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' });
  res.json(rows[0]);
});

app.listen(3000, () => console.log('http://localhost:3000'));
