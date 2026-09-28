module.exports = (db) => ({
  async findByUser(userId) {
    const [rows] = await db.execute(
      `SELECT id, title, content, created_at
       FROM articles
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );
    return rows;
  },

  async create(userId, title, content) {
    const [result] = await db.execute(
      'INSERT INTO articles (user_id, title, content) VALUES (?, ?, ?)',
      [userId, title, content]
    );
    return result.insertId;
  },
});