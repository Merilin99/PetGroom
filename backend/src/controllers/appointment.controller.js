import * as appointmentService from '../services/appointment.service.js';

export async function getAvailability(req, res, next) {
  try {
    res.json(await appointmentService.getAvailability(req.query));
  } catch (err) {
    next(err);
  }
}

export async function getAll(req, res, next) {
  try {
    res.json(await appointmentService.getAppointments(req.user));
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    res.json(await appointmentService.getAppointmentById(Number(req.params.id), req.user));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const appointment = await appointmentService.createAppointment(req.body, req.user);
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

export async function changeStatus(req, res, next) {
  try {
    res.json(await appointmentService.changeStatus(Number(req.params.id), req.body.status, req.user));
  } catch (err) {
    next(err);
  }
}
