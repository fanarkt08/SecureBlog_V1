const express = require('express');
const articleModel = require('../models/articleModel');
const requireAuth = require('../middlewares/requireAuth');

module.exports = (db) => {
  const router = express.Router();
  const articles = articleModel(db);

  router.get('/', requireAuth, async (req, res) => {
    res.json(await articles.findByUser(req.userId));
  });

  router.post('/', requireAuth, async (req, res) => {
    const { title, content } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    const id = await articles.create(req.userId, title.trim(), content.trim());
    res.status(201).json({ id });
  });

  return router;
};