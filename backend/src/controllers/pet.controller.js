import * as petService from '../services/pet.service.js';

export async function getAll(req, res, next) {
  try {
    res.json(await petService.getPets(req.user));
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    res.json(await petService.getPetById(Number(req.params.id), req.user));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const pet = await petService.createPet(req.body, req.user);
    res.status(201).json(pet);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    res.json(await petService.updatePet(Number(req.params.id), req.body, req.user));
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await petService.deletePet(Number(req.params.id), req.user);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
