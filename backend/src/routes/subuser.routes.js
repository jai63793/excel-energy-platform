import { Router } from 'express';
import { createSubUser, getSubUsers, deleteSubUser } from '../controllers/subuser.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);

router.post('/', createSubUser);
router.get('/', getSubUsers);
router.delete('/:id', deleteSubUser);

export default router;
