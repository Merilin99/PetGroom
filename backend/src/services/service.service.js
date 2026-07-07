import * as serviceRepository from '../repositories/service.repository.js';
import { ApiError } from '../middleware/errorHandler.js';

// Το service layer κρατά τη business logic - δεν ξέρει τίποτα για HTTP ή SQL.

export async function getAllServices() {
  return serviceRepository.findAll();
}

export async function getAllServicesAdmin() {
  return serviceRepository.findAllIncludingInactive();
}

export async function getServiceById(id) {
  const service = await serviceRepository.findById(id);
  if (!service) {
    throw new ApiError(404, 'Η υπηρεσία δεν βρέθηκε');
  }
  return service;
}

function validateServiceData({ name, durationMin, basePrice }) {
  if (!name?.trim()) {
    throw new ApiError(400, 'Το όνομα της υπηρεσίας είναι υποχρεωτικό');
  }
  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    throw new ApiError(400, 'Η διάρκεια πρέπει να είναι θετικός αριθμός λεπτών');
  }
  if (typeof basePrice !== 'number' || Number.isNaN(basePrice) || basePrice < 0) {
    throw new ApiError(400, 'Η τιμή πρέπει να είναι μη αρνητικός αριθμός');
  }
}

export async function createService(data) {
  validateServiceData(data);
  return serviceRepository.create({ ...data, name: data.name.trim() });
}

export async function updateService(id, data) {
  const existing = await getServiceById(id);
  // basePrice: η ΒΔ επιστρέφει DECIMAL ως string - το κάνουμε number πριν το validation
  const merged = { ...existing, basePrice: Number(existing.basePrice), ...data };
  validateServiceData(merged);
  return serviceRepository.update(id, { ...merged, name: merged.name.trim() });
}

export async function deleteService(id) {
  await getServiceById(id);
  await serviceRepository.deactivate(id);
}
