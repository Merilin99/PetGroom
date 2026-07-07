import * as serviceService from '../services/service.service.js';

// Ο controller μεταφράζει HTTP σε κλήσεις του service layer - καθόλου business logic εδώ.

export async function getAll(req, res, next) {
  try {
    const services = await serviceService.getAllServices();
    res.json(services);
  } catch (err) {
    next(err);
  }
}

export async function getAllAdmin(req, res, next) {
  try {
    res.json(await serviceService.getAllServicesAdmin());
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const service = await serviceService.getServiceById(Number(req.params.id));
    res.json(service);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const service = await serviceService.createService(req.body);
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    res.json(await serviceService.updateService(Number(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await serviceService.deleteService(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
