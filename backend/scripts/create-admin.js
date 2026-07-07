// Δημιουργεί (ή επαναφέρει τον κωδικό σε) έναν χρήστη ADMIN.
// Χρήση: npm run create-admin -- admin@petgroom.gr οΚωδικόςΜου123
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../src/config/db.js';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Χρήση: npm run create-admin -- <email> <password>');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
await pool.query(
  `INSERT INTO users (email, password_hash, first_name, last_name, role)
   VALUES (?, ?, 'Admin', 'PetGroom', 'ADMIN') AS new
   ON DUPLICATE KEY UPDATE password_hash = new.password_hash, role = 'ADMIN'`,
  [email, passwordHash]
);
console.log(`Ο διαχειριστής ${email} δημιουργήθηκε/ενημερώθηκε.`);
await pool.end();
