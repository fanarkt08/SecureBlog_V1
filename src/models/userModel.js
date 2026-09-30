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

  async findByGoogleId(googleId) {
    const [rows] = await db.execute('SELECT id, email FROM users WHERE google_id = ?', [googleId]);
    return rows[0] ?? null;
  },

  async linkGoogle(id, googleId) {
    await db.execute('UPDATE users SET google_id = ? WHERE id = ?', [googleId, id]);
  },

  async createFromGoogle(email, googleId) {
    const [r] = await db.execute('INSERT INTO users (email, google_id) VALUES (?, ?)', [email, googleId]);
    return { id: r.insertId, email };
  },
  
});