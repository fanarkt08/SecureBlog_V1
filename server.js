const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));

const page = (nom) => (req, res) =>
  res.sendFile(path.join(__dirname, 'public', nom + '.html'));

app.get('/', (req, res) => res.redirect('/api/login'));
app.get('/api/login', page('login'));
app.get('/api/register', page('register'));
app.get('/api/blog', page('blog'));

app.listen(3000, () => console.log('http://localhost:3000'));