const express = require('express');
const passport = require('passport');
const mysql = require('mysql2/promise');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const pagesRoutes = require('./src/routes/pages');
const authRoutes = require('./src/routes/auth');
const articlesRoutes = require('./src/routes/articles');
const googleRoutes = require('./src/routes/google');
const githubRoutes = require('./src/routes/github');

const app = express();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

require('./src/config/passport')(db);

app.use(helmet({
  contentSecurityPolicy: {
    directives: { 'img-src': ["'self'", 'data:', 'https://lh3.googleusercontent.com', 'https://cdn.jsdelivr.net', 'https://avatars.githubusercontent.com'] },
  },
}));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'src/view'), { index: false }));
app.use(passport.initialize());

app.get('/api/health', async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok'});
});

app.use('/', pagesRoutes);
app.use('/', googleRoutes(db));
app.use('/', githubRoutes(db));
app.use('/api/auth', authRoutes(db));
app.use('/api/articles', articlesRoutes(db));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(3000, () => console.log('http://localhost:3000'));