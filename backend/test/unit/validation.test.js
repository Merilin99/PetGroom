// Unit tests για τη λογική validation του service layer.
// Τρέχουν ΧΩΡΙΣ βάση δεδομένων: όλα τα σενάρια αποτυγχάνουν στο validation,
// πριν φτάσουν στο repository. Εκτέλεση: npm run test:unit
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import * as authService from '../../src/services/auth.service.js';
import * as petService from '../../src/services/pet.service.js';
import * as serviceService from '../../src/services/service.service.js';
import * as appointmentService from '../../src/services/appointment.service.js';
import { pool } from '../../src/config/db.js';

after(() => pool.end());

// Βοηθητικό: περιμένουμε ApiError με συγκεκριμένο status.
const rejectsWithStatus = (promise, status) =>
  assert.rejects(promise, (err) => {
    assert.equal(err.status, status, `περίμενα status ${status}, ήρθε ${err.status}: ${err.message}`);
    return true;
  });

const CUSTOMER = { id: 1, role: 'CUSTOMER' };

// --- Εγγραφή χρήστη ---

test('register: απορρίπτει μη έγκυρο email', () =>
  rejectsWithStatus(
    authService.register({ email: 'oxi-email', password: 'kodikos123', firstName: 'Α', lastName: 'Β' }),
    400
  ));

test('register: απορρίπτει κωδικό κάτω από 8 χαρακτήρες', () =>
  rejectsWithStatus(
    authService.register({ email: 'a@b.gr', password: '1234567', firstName: 'Α', lastName: 'Β' }),
    400
  ));

test('register: απαιτεί όνομα και επώνυμο', () =>
  rejectsWithStatus(
    authService.register({ email: 'a@b.gr', password: 'kodikos123', firstName: '  ', lastName: 'Β' }),
    400
  ));

// --- Κατοικίδια ---

test('createPet: απαιτεί όνομα', () =>
  rejectsWithStatus(
    petService.createPet({ name: '', species: 'DOG', size: 'SMALL' }, CUSTOMER),
    400
  ));

test('createPet: απορρίπτει άγνωστο είδος', () =>
  rejectsWithStatus(
    petService.createPet({ name: 'Ψαράκι', species: 'FISH', size: 'SMALL' }, CUSTOMER),
    400
  ));

test('createPet: απορρίπτει άγνωστο μέγεθος', () =>
  rejectsWithStatus(
    petService.createPet({ name: 'Ρεξ', species: 'DOG', size: 'HUGE' }, CUSTOMER),
    400
  ));

// --- Υπηρεσίες ---

test('createService: απαιτεί όνομα', () =>
  rejectsWithStatus(
    serviceService.createService({ name: ' ', durationMin: 30, basePrice: 10 }),
    400
  ));

test('createService: απορρίπτει μη θετική διάρκεια', () =>
  rejectsWithStatus(
    serviceService.createService({ name: 'Τεστ', durationMin: 0, basePrice: 10 }),
    400
  ));

test('createService: απορρίπτει αρνητική τιμή', () =>
  rejectsWithStatus(
    serviceService.createService({ name: 'Τεστ', durationMin: 30, basePrice: -5 }),
    400
  ));

// --- Διαθεσιμότητα ---

test('getAvailability: απορρίπτει λάθος μορφή ημερομηνίας', () =>
  rejectsWithStatus(
    appointmentService.getAvailability({ groomerId: 1, serviceId: 1, date: '10-07-2026' }),
    400
  ));
