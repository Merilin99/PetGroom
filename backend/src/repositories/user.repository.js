import { pool } from '../config/db.js';

// Τα aliases μετατρέπουν το snake_case της ΒΔ σε camelCase για το υπόλοιπο app.
const USER_COLUMNS = `
  id, email, password_hash AS passwordHash, first_name AS firstName,
  last_name AS lastName, phone, role, created_at AS createdAt
`;

// Χωρίς password_hash - για λίστες που βγαίνουν προς τα έξω.
const PUBLIC_USER_COLUMNS = `
  id, email, first_name AS firstName, last_name AS lastName,
  phone, role, created_at AS createdAt
`;

export async function findAll(role) {
  if (role) {
    const [rows] = await pool.query(
      `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE role = ? ORDER BY last_name, first_name`,
      [role]
    );
    return rows;
  }
  const [rows] = await pool.query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY last_name, first_name`
  );
  return rows;
}

export async function updateRole(id, role) {
  await pool.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
}

export async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = ?`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create({ email, passwordHash, firstName, lastName, phone, role }) {
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [email, passwordHash, firstName, lastName, phone ?? null, role ?? 'CUSTOMER']
  );
  return findById(result.insertId);
}
