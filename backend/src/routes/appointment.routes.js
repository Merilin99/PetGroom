import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';

// Το authenticate εφαρμόζεται σε ΟΛΟ το /api/appointments στο app.js.
const router = Router();

// Πριν το /:id για να μην "πιαστεί" ως id.
router.get('/availability', appointmentController.getAvailability);

router.get('/', appointmentController.getAll);
router.post('/', appointmentController.create);
router.get('/:id', appointmentController.getById);
router.patch('/:id/status', appointmentController.changeStatus);

export default router;
