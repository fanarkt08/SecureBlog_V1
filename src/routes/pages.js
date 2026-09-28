const express = require('express');
const path = require('path');

const router = express.Router();

const page = (nom) => (req, res) =>
  res.sendFile(path.join(__dirname, '../view', nom + '.html'));

router.get('/', (req, res) => res.redirect('/login'));
router.get('/login', page('login'));
router.get('/register', page('register'));
router.get('/blog', page('blog'));

module.exports = router;