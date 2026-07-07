import { pool } from '../config/db.js';

const PET_COLUMNS = `
  id, owner_id AS ownerId, name, species, breed, size, notes, created_at AS createdAt
`;

export async function findAll() {
  const [rows] = await pool.query(
    `SELECT ${PET_COLUMNS} FROM pets ORDER BY name`
  );
  return rows;
}

export async function findAllByOwner(ownerId) {
  const [rows] = await pool.query(
    `SELECT ${PET_COLUMNS} FROM pets WHERE owner_id = ? ORDER BY name`,
    [ownerId]
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${PET_COLUMNS} FROM pets WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create({ ownerId, name, species, breed, size, notes }) {
  const [result] = await pool.query(
    `INSERT INTO pets (owner_id, name, species, breed, size, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ownerId, name, species, breed ?? null, size, notes ?? null]
  );
  return findById(result.insertId);
}

export async function update(id, { name, species, breed, size, notes }) {
  await pool.query(
    `UPDATE pets SET name = ?, species = ?, breed = ?, size = ?, notes = ?
     WHERE id = ?`,
    [name, species, breed ?? null, size, notes ?? null, id]
  );
  return findById(id);
}

export async function remove(id) {
  await pool.query(`DELETE FROM pets WHERE id = ?`, [id]);
}
