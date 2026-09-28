module.exports = (db) => ({
  async create(email, passwordHash) {
    await db.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
  },

  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT id, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, email, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },
});