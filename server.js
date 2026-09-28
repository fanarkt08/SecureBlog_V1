const express = require('express');
const app = express();

app.use(express.static('public', { extensions: ['html'] }));
app.get('/', (req, res) => res.redirect('/login'));

app.listen(3000, () => console.log('http://localhost:3000'));
