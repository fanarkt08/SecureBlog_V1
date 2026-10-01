const providerColumns = { google: 'google_sub', github: 'github_id' };

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

  async loginFromProvider(provider, providerId, email, name, picture) {
    const column = providerColumns[provider];
    const [rows] = await db.execute(`SELECT id FROM users WHERE ${column} = ?`, [providerId]);
    if (rows[0]) {
      await db.execute(
        'UPDATE users SET name = ?, picture = ? WHERE id = ?',
        [name ?? null, picture ?? null, rows[0].id]
      );
      return rows[0].id;
    }
    const [result] = await db.execute(
      `INSERT INTO users (${column}, email, name, picture) VALUES (?, ?, ?, ?)`,
      [providerId, email, name ?? null, picture ?? null]
    );
    return result.insertId;
  },
});