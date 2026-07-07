// Integration tests: σηκώνουν το Express app σε τυχαία πόρτα και χτυπούν
// τα πραγματικά endpoints με fetch, πάνω στη ΒΔ του docker-compose.
// Προϋπόθεση: τρέχει η MySQL (docker compose up -d) και υπάρχει backend/.env.
// Τα δεδομένα που δημιουργούνται καθαρίζονται στο τέλος. Εκτέλεση: npm test
import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import bcrypt from 'bcryptjs';
import app from '../../src/app.js';
import { pool } from '../../src/config/db.js';

const stamp = Date.now();
const PASSWORD = 'kodikos123';
const adminEmail = `itest-admin-${stamp}@test.gr`;
const customerEmail = `itest-cust-${stamp}@test.gr`;
const groomerEmail = `itest-groomer-${stamp}@test.gr`;

let server;
let base;
let adminToken;
let customerToken;
let groomerToken;
let groomerId;
let serviceId;
let petId;
let appointmentId;
let slot;

// Αύριο, σε μορφή YYYY-MM-DD (τα ραντεβού πρέπει να είναι στο μέλλον).
const pad = (n) => String(n).padStart(2, '0');
const t = new Date(Date.now() + 24 * 60 * 60 * 1000);
const tomorrow = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}

async function login(email) {
  const res = await api('/api/auth/login', { method: 'POST', body: { email, password: PASSWORD } });
  assert.equal(res.status, 200);
  return res.data.token;
}

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;

  // Ο admin δεν δημιουργείται μέσω API (σωστά) - τον σπέρνουμε απευθείας στη ΒΔ.
  const hash = await bcrypt.hash(PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES (?, ?, 'Τεστ', 'Admin', 'ADMIN')`,
    [adminEmail, hash]
  );
  adminToken = await login(adminEmail);
});

after(async () => {
  // Καθάρισμα ό,τι δημιούργησαν τα tests (με σειρά που σέβεται τα foreign keys).
  const [users] = await pool.query('SELECT id FROM users WHERE email LIKE ?', [`itest-%-${stamp}@test.gr`]);
  const ids = users.map((u) => u.id);
  if (ids.length > 0) {
    await pool.query(
      `DELETE a FROM appointments a
       LEFT JOIN pets p ON p.id = a.pet_id
       WHERE a.groomer_id IN (?) OR p.owner_id IN (?)`,
      [ids, ids]
    );
    await pool.query('DELETE FROM pets WHERE owner_id IN (?)', [ids]);
    await pool.query('DELETE FROM users WHERE id IN (?)', [ids]);
  }
  server.close();
  await pool.end();
});

// --- Auth ---

test('health endpoint απαντά', async () => {
  const res = await api('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
});

test('εγγραφή πελάτη επιστρέφει 201 και ρόλο CUSTOMER', async () => {
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: { email: customerEmail, password: PASSWORD, firstName: 'Τεστ', lastName: 'Πελάτης' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.role, 'CUSTOMER');
  customerToken = await login(customerEmail);
});

test('διπλό email επιστρέφει 409', async () => {
  const res = await api('/api/auth/register', {
    method: 'POST',
    body: { email: customerEmail, password: PASSWORD, firstName: 'Α', lastName: 'Β' },
  });
  assert.equal(res.status, 409);
});

test('ο admin προάγει χρήστη σε GROOMER', async () => {
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: { email: groomerEmail, password: PASSWORD, firstName: 'Τεστ', lastName: 'Groomer' },
  });
  assert.equal(reg.status, 201);
  groomerId = reg.data.id;

  const res = await api(`/api/users/${groomerId}/role`, {
    method: 'PUT',
    token: adminToken,
    body: { role: 'GROOMER' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.role, 'GROOMER');
  groomerToken = await login(groomerEmail);
});

// --- Authorization ---

test('χωρίς token τα προστατευμένα endpoints γυρνούν 401', async () => {
  const res = await api('/api/pets');
  assert.equal(res.status, 401);
});

test('ο πελάτης δεν μπορεί να δημιουργήσει υπηρεσία (403)', async () => {
  const res = await api('/api/services', {
    method: 'POST',
    token: customerToken,
    body: { name: 'Παράνομη', durationMin: 30, basePrice: 10 },
  });
  assert.equal(res.status, 403);
});

test('ο admin βλέπει και τις ανενεργές υπηρεσίες', async () => {
  const res = await api('/api/services/all', { token: adminToken });
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
});

// --- Κατοικίδια ---

test('ο πελάτης καταχωρεί κατοικίδιο', async () => {
  const res = await api('/api/pets', {
    method: 'POST',
    token: customerToken,
    body: { name: 'Τεστόπουλο', species: 'DOG', size: 'SMALL', notes: 'Ελληνικά ΟΚ' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.name, 'Τεστόπουλο');
  petId = res.data.id;
});

test('ξένος χρήστης δεν βλέπει το κατοικίδιο (403)', async () => {
  const res = await api(`/api/pets/${petId}`, { token: groomerToken });
  assert.equal(res.status, 403);
});

// --- Ραντεβού ---

test('η διαθεσιμότητα επιστρέφει ελεύθερες ώρες', async () => {
  const services = await api('/api/services');
  assert.equal(services.status, 200);
  serviceId = services.data[0].id;

  const res = await api(
    `/api/appointments/availability?groomerId=${groomerId}&serviceId=${serviceId}&date=${tomorrow}`,
    { token: customerToken }
  );
  assert.equal(res.status, 200);
  assert.ok(res.data.slots.length > 0, 'περίμενα διαθέσιμες ώρες για φρέσκο groomer');
  slot = res.data.slots[0];
});

test('η κράτηση δημιουργείται με κατάσταση PENDING', async () => {
  const res = await api('/api/appointments', {
    method: 'POST',
    token: customerToken,
    body: { petId, serviceId, groomerId, startsAt: `${tomorrow} ${slot}` },
  });
  assert.equal(res.status, 201);
  assert.equal(res.data.status, 'PENDING');
  appointmentId = res.data.id;
});

test('επικαλυπτόμενη κράτηση γυρνάει 409', async () => {
  const res = await api('/api/appointments', {
    method: 'POST',
    token: customerToken,
    body: { petId, serviceId, groomerId, startsAt: `${tomorrow} ${slot}` },
  });
  assert.equal(res.status, 409);
});

test('ο πελάτης δεν μπορεί να επιβεβαιώσει (403)', async () => {
  const res = await api(`/api/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    token: customerToken,
    body: { status: 'CONFIRMED' },
  });
  assert.equal(res.status, 403);
});

test('ο groomer επιβεβαιώνει το ραντεβού', async () => {
  const res = await api(`/api/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    token: groomerToken,
    body: { status: 'CONFIRMED' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'CONFIRMED');
});

test('ο πελάτης ακυρώνει το ραντεβού του', async () => {
  const res = await api(`/api/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    token: customerToken,
    body: { status: 'CANCELLED' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'CANCELLED');
});

test('μετάβαση από CANCELLED απορρίπτεται (400)', async () => {
  const res = await api(`/api/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    token: groomerToken,
    body: { status: 'CONFIRMED' },
  });
  assert.equal(res.status, 400);
});
