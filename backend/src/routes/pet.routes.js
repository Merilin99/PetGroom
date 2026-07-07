import { Router } from 'express';
import * as petController from '../controllers/pet.controller.js';

// Το authenticate εφαρμόζεται σε ΟΛΟ το /api/pets στο app.js -
// εδώ φτάνουν μόνο συνδεδεμένοι χρήστες.
const router = Router();

router.get('/', petController.getAll);
router.post('/', petController.create);
router.get('/:id', petController.getById);
router.put('/:id', petController.update);
router.delete('/:id', petController.remove);

export default router;
