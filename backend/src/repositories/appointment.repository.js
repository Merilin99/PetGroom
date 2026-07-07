import { pool } from '../config/db.js';

// Λεπτομερής προβολή ραντεβού με ονόματα από όλους τους σχετικούς πίνακες.
const DETAILED_SELECT = `
  SELECT a.id, a.starts_at AS startsAt, a.ends_at AS endsAt, a.status, a.notes,
         a.pet_id AS petId, p.name AS petName,
         p.owner_id AS ownerId, CONCAT(o.first_name, ' ', o.last_name) AS ownerName,
         a.service_id AS serviceId, s.name AS serviceName,
         a.groomer_id AS groomerId, CONCAT(g.first_name, ' ', g.last_name) AS groomerName
  FROM appointments a
  JOIN pets p ON p.id = a.pet_id
  JOIN users o ON o.id = p.owner_id
  JOIN services s ON s.id = a.service_id
  JOIN users g ON g.id = a.groomer_id
`;

// Φιλτράρισμα ανάλογα με τον ρόλο: ownerId για πελάτη, groomerId για groomer, τίποτα για admin.
export async function findAllDetailed({ ownerId, groomerId } = {}) {
  const where = [];
  const params = [];
  if (ownerId) {
    where.push('p.owner_id = ?');
    params.push(ownerId);
  }
  if (groomerId) {
    where.push('a.groomer_id = ?');
    params.push(groomerId);
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `${DETAILED_SELECT} ${whereClause} ORDER BY a.starts_at`,
    params
  );
  return rows;
}

export async function findById(id) {
  const [rows] = await pool.query(`${DETAILED_SELECT} WHERE a.id = ?`, [id]);
  return rows[0] ?? null;
}

// Ενεργά ραντεβού ενός groomer σε μια μέρα - για τον υπολογισμό διαθεσιμότητας.
export async function findActiveByGroomerAndDate(groomerId, date) {
  const [rows] = await pool.query(
    `SELECT starts_at AS startsAt, ends_at AS endsAt
     FROM appointments
     WHERE groomer_id = ? AND status IN ('PENDING', 'CONFIRMED') AND DATE(starts_at) = ?
     ORDER BY starts_at`,
    [groomerId, date]
  );
  return rows;
}

// Έλεγχοι επικάλυψης: δύο διαστήματα συμπίπτουν όταν startA < endB ΚΑΙ endA > startB.
// Το FOR UPDATE κλειδώνει τις γραμμές μέσα στο transaction, ώστε δύο ταυτόχρονες
// κρατήσεις να μην περάσουν και οι δύο τον έλεγχο (race condition).

export async function findGroomerOverlaps(groomerId, startsAt, endsAt, conn = pool) {
  const [rows] = await conn.query(
    `SELECT id FROM appointments
     WHERE groomer_id = ? AND status IN ('PENDING', 'CONFIRMED')
       AND starts_at < ? AND ends_at > ?
     FOR UPDATE`,
    [groomerId, endsAt, startsAt]
  );
  return rows;
}

export async function findPetOverlaps(petId, startsAt, endsAt, conn = pool) {
  const [rows] = await conn.query(
    `SELECT id FROM appointments
     WHERE pet_id = ? AND status IN ('PENDING', 'CONFIRMED')
       AND starts_at < ? AND ends_at > ?
     FOR UPDATE`,
    [petId, endsAt, startsAt]
  );
  return rows;
}

export async function create({ petId, serviceId, groomerId, startsAt, endsAt, notes }, conn = pool) {
  const [result] = await conn.query(
    `INSERT INTO appointments (pet_id, service_id, groomer_id, starts_at, ends_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [petId, serviceId, groomerId, startsAt, endsAt, notes ?? null]
  );
  return result.insertId;
}

export async function updateStatus(id, status) {
  await pool.query(`UPDATE appointments SET status = ? WHERE id = ?`, [status, id]);
}
