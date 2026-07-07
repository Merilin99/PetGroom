import { pool } from '../config/db.js';

// Το repository είναι το ΜΟΝΟ layer που γράφει SQL.
// Πάντα parameterized queries (?) - ποτέ string concatenation (SQL injection).

// Τα aliases μετατρέπουν το snake_case της ΒΔ σε camelCase για το υπόλοιπο app.
const SERVICE_COLUMNS = `
  id, name, description, duration_min AS durationMin,
  base_price AS basePrice, is_active AS isActive
`;

export async function findAll() {
  const [rows] = await pool.query(
    `SELECT ${SERVICE_COLUMNS}
     FROM services
     WHERE is_active = TRUE
     ORDER BY name`
  );
  return rows;
}

// Για τον admin: όλες οι υπηρεσίες, και οι ανενεργές.
export async function findAllIncludingInactive() {
  const [rows] = await pool.query(
    `SELECT ${SERVICE_COLUMNS} FROM services ORDER BY is_active DESC, name`
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SERVICE_COLUMNS}
     FROM services
     WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create({ name, description, durationMin, basePrice }) {
  const [result] = await pool.query(
    `INSERT INTO services (name, description, duration_min, base_price)
     VALUES (?, ?, ?, ?)`,
    [name, description ?? null, durationMin, basePrice]
  );
  return findById(result.insertId);
}

export async function update(id, { name, description, durationMin, basePrice, isActive }) {
  await pool.query(
    `UPDATE services
     SET name = ?, description = ?, duration_min = ?, base_price = ?, is_active = ?
     WHERE id = ?`,
    [name, description ?? null, durationMin, basePrice, isActive, id]
  );
  return findById(id);
}

// Soft delete: οι υπηρεσίες δεν διαγράφονται (τις δείχνουν παλιά ραντεβού),
// απλώς απενεργοποιούνται και φεύγουν από τη δημόσια λίστα.
export async function deactivate(id) {
  await pool.query(`UPDATE services SET is_active = FALSE WHERE id = ?`, [id]);
}
