import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Δημόσια: όλοι βλέπουν τον κατάλογο υπηρεσιών
router.get('/', serviceController.getAll);

// Μόνο ADMIN: πλήρης λίστα με ανενεργές (πριν το /:id για να μην πιαστεί ως id)
router.get('/all', authenticate, authorize('ADMIN'), serviceController.getAllAdmin);

router.get('/:id', serviceController.getById);

// Μόνο ADMIN: διαχείριση καταλόγου
router.post('/', authenticate, authorize('ADMIN'), serviceController.create);
router.put('/:id', authenticate, authorize('ADMIN'), serviceController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), serviceController.remove);

export default router;
