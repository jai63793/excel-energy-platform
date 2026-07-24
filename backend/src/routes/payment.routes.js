import { Router } from 'express';
import { createOrder, verifyPayment, handleWebhook, getMyPayments } from '../controllers/payment.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Protected Payment actions
router.post('/create-order', authenticateJWT, createOrder);
router.post('/verify-payment', authenticateJWT, verifyPayment);
router.get('/my-history', authenticateJWT, getMyPayments);

// Public webhook endpoint for Razorpay servers
router.post('/webhook', handleWebhook);

export default router;
