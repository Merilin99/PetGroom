import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/user.repository.js';
import { ApiError } from '../middleware/errorHandler.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Αφαιρεί το passwordHash - ποτέ δεν επιστρέφουμε hash στον client.
function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function register({ email, password, firstName, lastName, phone }) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Μη έγκυρο email');
  }
  if (!password || password.length < 8) {
    throw new ApiError(400, 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες');
  }
  if (!firstName?.trim() || !lastName?.trim()) {
    throw new ApiError(400, 'Το όνομα και το επώνυμο είναι υποχρεωτικά');
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ApiError(409, 'Το email χρησιμοποιείται ήδη');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Μέσω register δημιουργούνται μόνο CUSTOMERS - ο ρόλος δεν γίνεται δεκτός από τον client.
  const user = await userRepository.create({
    email, passwordHash, firstName: firstName.trim(), lastName: lastName.trim(), phone,
  });
  return toPublicUser(user);
}

export async function login({ email, password }) {
  const user = email ? await userRepository.findByEmail(email) : null;
  const valid = user && (await bcrypt.compare(password ?? '', user.passwordHash));
  // Ενιαίο μήνυμα: δεν αποκαλύπτουμε αν το email υπάρχει.
  if (!valid) {
    throw new ApiError(401, 'Λάθος email ή κωδικός');
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });
  return { token, user: toPublicUser(user) };
}

export async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Ο χρήστης δεν βρέθηκε');
  }
  return toPublicUser(user);
}
