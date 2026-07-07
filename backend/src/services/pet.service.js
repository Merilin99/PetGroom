import * as petRepository from '../repositories/pet.repository.js';
import { ApiError } from '../middleware/errorHandler.js';

const SPECIES = ['DOG', 'CAT', 'OTHER'];
const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];

function validatePetData({ name, species, size }) {
  if (!name?.trim()) {
    throw new ApiError(400, 'Το όνομα του κατοικιδίου είναι υποχρεωτικό');
  }
  if (!SPECIES.includes(species)) {
    throw new ApiError(400, `Το είδος πρέπει να είναι ένα από: ${SPECIES.join(', ')}`);
  }
  if (!SIZES.includes(size)) {
    throw new ApiError(400, `Το μέγεθος πρέπει να είναι ένα από: ${SIZES.join(', ')}`);
  }
}

// Ownership check: ο CUSTOMER βλέπει/διαχειρίζεται ΜΟΝΟ τα δικά του κατοικίδια,
// ο ADMIN όλα. Επιστρέφει 404 πριν το 403, ώστε να μην αποκαλύπτεται τι υπάρχει.
async function getOwnedPet(id, user) {
  const pet = await petRepository.findById(id);
  if (!pet) {
    throw new ApiError(404, 'Το κατοικίδιο δεν βρέθηκε');
  }
  if (user.role !== 'ADMIN' && pet.ownerId !== user.id) {
    throw new ApiError(403, 'Δεν έχεις πρόσβαση σε αυτό το κατοικίδιο');
  }
  return pet;
}

export async function getPets(user) {
  if (user.role === 'ADMIN') {
    return petRepository.findAll();
  }
  return petRepository.findAllByOwner(user.id);
}

export async function getPetById(id, user) {
  return getOwnedPet(id, user);
}

export async function createPet(data, user) {
  validatePetData(data);
  // Το κατοικίδιο ανήκει πάντα στον συνδεδεμένο χρήστη - όχι σε ownerId από τον client.
  return petRepository.create({ ...data, name: data.name.trim(), ownerId: user.id });
}

export async function updatePet(id, data, user) {
  const existing = await getOwnedPet(id, user);
  const merged = { ...existing, ...data };
  validatePetData(merged);
  return petRepository.update(id, { ...merged, name: merged.name.trim() });
}

export async function deletePet(id, user) {
  await getOwnedPet(id, user);
  await petRepository.remove(id);
}
