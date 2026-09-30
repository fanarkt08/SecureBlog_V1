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
      'SELECT id, email, name, picture, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  },

  async findByGoogleSub(sub) {
    const [rows] = await db.execute('SELECT id FROM users WHERE google_sub = ?', [sub]);
    return rows[0];
  },

  async createGoogle(sub, email, name, picture) {
    const [result] = await db.execute(
      'INSERT INTO users (google_sub, email, name, picture) VALUES (?, ?, ?, ?)',
      [sub, email, name ?? null, picture ?? null]
    );
    return result.insertId;
  },

  async updateGoogleProfile(id, name, picture) {
    await db.execute(
      'UPDATE users SET name = ?, picture = ? WHERE id = ?',
      [name ?? null, picture ?? null, id]
    );
  },
});