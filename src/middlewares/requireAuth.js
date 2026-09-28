module.exports = (req, res, next) =>
  req.session.userId ? next() : res.status(401).json({ error: 'Not authenticated' });