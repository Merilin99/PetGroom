import { withTransaction } from '../config/db.js';
import * as appointmentRepository from '../repositories/appointment.repository.js';
import * as petRepository from '../repositories/pet.repository.js';
import * as serviceRepository from '../repositories/service.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { ApiError } from '../middleware/errorHandler.js';

// Ωράριο καταστήματος και βήμα διαθέσιμων ωρών.
const OPENING_MINUTES = 9 * 60;   // 09:00
const CLOSING_MINUTES = 17 * 60;  // 17:00
const SLOT_STEP_MINUTES = 30;

// --- Βοηθητικά για datetimes ως strings 'YYYY-MM-DD HH:MM:SS' ---
// Με σταθερό format, οι συγκρίσεις γίνονται απευθείας σε strings (αλφαβητικά = χρονολογικά).

const pad = (n) => String(n).padStart(2, '0');

function formatDateTime(dt) {
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ` +
         `${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
}

function nowDateTime() {
  return formatDateTime(new Date());
}

// Δέχεται '2026-07-10 09:00', '2026-07-10T09:00' ή με δευτερόλεπτα - επιστρέφει κανονικοποιημένο string.
function normalizeDateTime(input) {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::\d{2})?$/.exec(input ?? '');
  if (!match) {
    throw new ApiError(400, 'Η ημερομηνία/ώρα πρέπει να έχει μορφή YYYY-MM-DD HH:MM');
  }
  return `${match[1]} ${match[2]}:${match[3]}:00`;
}

function addMinutes(dateTimeStr, minutes) {
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi, s] = timePart.split(':').map(Number);
  return formatDateTime(new Date(y, mo - 1, d, h, mi + minutes, s));
}

function minutesOfDay(dateTimeStr) {
  const [h, m] = dateTimeStr.split(' ')[1].split(':').map(Number);
  return h * 60 + m;
}

// --- Κοινοί έλεγχοι ---

async function getActiveService(serviceId) {
  const service = await serviceRepository.findById(serviceId);
  if (!service || !service.isActive) {
    throw new ApiError(404, 'Η υπηρεσία δεν βρέθηκε ή δεν είναι διαθέσιμη');
  }
  return service;
}

async function getGroomer(groomerId) {
  const groomer = await userRepository.findById(groomerId);
  if (!groomer || groomer.role !== 'GROOMER') {
    throw new ApiError(404, 'Ο groomer δεν βρέθηκε');
  }
  return groomer;
}

function canAccess(appointment, user) {
  return (
    user.role === 'ADMIN' ||
    appointment.ownerId === user.id ||
    appointment.groomerId === user.id
  );
}

// --- Διαθεσιμότητα ---

export async function getAvailability({ groomerId, serviceId, date }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
    throw new ApiError(400, 'Η ημερομηνία πρέπει να έχει μορφή YYYY-MM-DD');
  }
  const service = await getActiveService(Number(serviceId));
  await getGroomer(Number(groomerId));

  const busy = await appointmentRepository.findActiveByGroomerAndDate(Number(groomerId), date);
  const now = nowDateTime();

  const slots = [];
  for (let m = OPENING_MINUTES; m + service.durationMin <= CLOSING_MINUTES; m += SLOT_STEP_MINUTES) {
    const time = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
    const slotStart = `${date} ${time}:00`;
    const slotEnd = addMinutes(slotStart, service.durationMin);
    if (slotStart <= now) continue; // όχι κρατήσεις στο παρελθόν
    const overlaps = busy.some((b) => b.startsAt < slotEnd && b.endsAt > slotStart);
    if (!overlaps) slots.push(time);
  }

  return {
    date,
    groomerId: Number(groomerId),
    serviceId: Number(serviceId),
    durationMin: service.durationMin,
    slots,
  };
}

// --- Κράτηση ---

export async function createAppointment({ petId, serviceId, groomerId, startsAt, notes }, user) {
  const pet = await petRepository.findById(Number(petId));
  if (!pet) {
    throw new ApiError(404, 'Το κατοικίδιο δεν βρέθηκε');
  }
  if (user.role !== 'ADMIN' && pet.ownerId !== user.id) {
    throw new ApiError(403, 'Μπορείς να κλείσεις ραντεβού μόνο για δικό σου κατοικίδιο');
  }

  const service = await getActiveService(Number(serviceId));
  await getGroomer(Number(groomerId));

  const start = normalizeDateTime(startsAt);
  const end = addMinutes(start, service.durationMin);

  if (start <= nowDateTime()) {
    throw new ApiError(400, 'Το ραντεβού πρέπει να είναι στο μέλλον');
  }
  if (minutesOfDay(start) < OPENING_MINUTES || minutesOfDay(start) + service.durationMin > CLOSING_MINUTES) {
    throw new ApiError(400, 'Το ραντεβού πρέπει να είναι εντός ωραρίου (09:00-17:00)');
  }

  // Έλεγχος επικάλυψης + INSERT ατομικά, ώστε δύο ταυτόχρονες κρατήσεις
  // να μην πάρουν και οι δύο το ίδιο slot.
  const appointmentId = await withTransaction(async (conn) => {
    const groomerBusy = await appointmentRepository.findGroomerOverlaps(
      Number(groomerId), start, end, conn
    );
    if (groomerBusy.length > 0) {
      throw new ApiError(409, 'Ο groomer έχει ήδη ραντεβού εκείνη την ώρα');
    }
    const petBusy = await appointmentRepository.findPetOverlaps(Number(petId), start, end, conn);
    if (petBusy.length > 0) {
      throw new ApiError(409, 'Το κατοικίδιο έχει ήδη ραντεβού εκείνη την ώρα');
    }
    return appointmentRepository.create(
      { petId: Number(petId), serviceId: Number(serviceId), groomerId: Number(groomerId), startsAt: start, endsAt: end, notes },
      conn
    );
  });

  return appointmentRepository.findById(appointmentId);
}

// --- Προβολή ---

export async function getAppointments(user) {
  if (user.role === 'ADMIN') return appointmentRepository.findAllDetailed();
  if (user.role === 'GROOMER') return appointmentRepository.findAllDetailed({ groomerId: user.id });
  return appointmentRepository.findAllDetailed({ ownerId: user.id });
}

export async function getAppointmentById(id, user) {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) {
    throw new ApiError(404, 'Το ραντεβού δεν βρέθηκε');
  }
  if (!canAccess(appointment, user)) {
    throw new ApiError(403, 'Δεν έχεις πρόσβαση σε αυτό το ραντεβού');
  }
  return appointment;
}

// --- Αλλαγή κατάστασης ---

// Έγκυρες μεταβάσεις ανεξαρτήτως ρόλου.
const TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export async function changeStatus(id, newStatus, user) {
  const appointment = await getAppointmentById(id, user); // κάνει και τον έλεγχο πρόσβασης

  if (!Object.hasOwn(TRANSITIONS, newStatus)) {
    throw new ApiError(400, `Η κατάσταση πρέπει να είναι μία από: ${Object.keys(TRANSITIONS).join(', ')}`);
  }
  if (!TRANSITIONS[appointment.status].includes(newStatus)) {
    throw new ApiError(400, `Δεν επιτρέπεται μετάβαση από ${appointment.status} σε ${newStatus}`);
  }

  // Ο πελάτης μπορεί μόνο να ακυρώσει - επιβεβαίωση/ολοκλήρωση κάνουν groomer/admin.
  if (user.role === 'CUSTOMER' && newStatus !== 'CANCELLED') {
    throw new ApiError(403, 'Μπορείς μόνο να ακυρώσεις το ραντεβού');
  }

  await appointmentRepository.updateStatus(id, newStatus);
  return appointmentRepository.findById(id);
}
