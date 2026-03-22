const pool = require('../config/db');

async function findUserByEmail(email) {
  const query = 'SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1 LIMIT 1';
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const query = 'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1 LIMIT 1';
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function createUser({ nombre, email, passwordHash, rol = 'cliente' }) {
  const query = `
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES ($1, $2, $3, $4)
    RETURNING id, nombre, email, rol, created_at
  `;

  const values = [nombre, email, passwordHash, rol];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};
