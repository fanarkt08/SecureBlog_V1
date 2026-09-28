const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const path = require('path');

const pagesRoutes = require('./src/routes/pages');
const authRoutes = require('./src/routes/auth');
const articlesRoutes = require('./src/routes/articles');

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
app.use(express.static(path.join(__dirname, 'src/view'), { index: false }));

app.use('/', pagesRoutes);
app.use('/api', authRoutes(db));
app.use('/api/articles', articlesRoutes(db));

app.listen(3000, () => console.log('http://localhost:3000'));