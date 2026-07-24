import { Router } from 'express';
import { submitContactForm } from '../controllers/contact.controller.js';
import { validateContactForm } from '../middleware/validation.js';

const router = Router();

// Public submission path
router.post('/submit', validateContactForm, submitContactForm);

export default router;
