import mysql from 'mysql2/promise';

// Ένα κοινό connection pool για όλη την εφαρμογή.
// Η σύνδεση ανοίγει στο πρώτο query, όχι κατά τη δημιουργία του pool.
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'petgroom',
  password: process.env.DB_PASSWORD || 'petgroom',
  database: process.env.DB_NAME || 'petgroom',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4', // ρητά, για σωστή αποθήκευση ελληνικών/emoji
  decimalNumbers: true, // DECIMAL ως number αντί για string (ΟΚ για τιμές υπηρεσιών)
  // DATETIME ως string 'YYYY-MM-DD HH:MM:SS' αντί για JS Date:
  // αποφεύγει μπερδέματα timezone και επιτρέπει απλές συγκρίσεις strings.
  dateStrings: true,
});

// Εκτελεί την fn μέσα σε transaction και κάνει commit/rollback αυτόματα.
// Χρήση: withTransaction(async (conn) => { ...queries με conn... })
export async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
