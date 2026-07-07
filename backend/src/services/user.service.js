import * as userRepository from '../repositories/user.repository.js';
import { ApiError } from '../middleware/errorHandler.js';

const ROLES = ['CUSTOMER', 'GROOMER', 'ADMIN'];

export async function getUsers(role) {
  if (role && !ROLES.includes(role)) {
    throw new ApiError(400, `Ο ρόλος πρέπει να είναι ένας από: ${ROLES.join(', ')}`);
  }
  return userRepository.findAll(role);
}

// Για το booking: κάθε συνδεδεμένος χρήστης βλέπει μόνο id + όνομα των groomers.
export async function getGroomers() {
  const groomers = await userRepository.findAll('GROOMER');
  return groomers.map(({ id, firstName, lastName }) => ({ id, firstName, lastName }));
}

export async function changeUserRole(id, role, currentUser) {
  if (!ROLES.includes(role)) {
    throw new ApiError(400, `Ο ρόλος πρέπει να είναι ένας από: ${ROLES.join(', ')}`);
  }
  if (id === currentUser.id) {
    throw new ApiError(400, 'Δεν μπορείς να αλλάξεις τον δικό σου ρόλο');
  }
  const user = await userRepository.findById(id);
  if (!user) {
    throw new ApiError(404, 'Ο χρήστης δεν βρέθηκε');
  }
  await userRepository.updateRole(id, role);
  return { ...user, passwordHash: undefined, role };
}
