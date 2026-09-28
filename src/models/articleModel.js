module.exports = (db) => ({
  async findAll() {
    const [rows] = await db.execute(
      `SELECT a.id, a.title, a.content, a.created_at, u.email AS author
       FROM articles a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC`
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