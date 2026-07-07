import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Κάθε συνδεδεμένος χρήστης: λίστα groomers για την κράτηση ραντεβού
router.get('/groomers', authenticate, userController.getGroomers);

// Μόνο ADMIN: διαχείριση χρηστών
router.get('/', authenticate, authorize('ADMIN'), userController.getAll);
router.put('/:id/role', authenticate, authorize('ADMIN'), userController.changeRole);

export default router;
