import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import {
  getAvailableHealers,
  createBooking,
  getUserBookings,
  cancelBooking,
  getLiveSessions
} from '../controllers/booking.controller.js';

const router = express.Router();

// Public / Authenticated Live Sessions route
router.get('/live-sessions', getLiveSessions);

// Require auth for booking actions
router.use(authenticateJWT);

router.get('/healers', getAvailableHealers);
router.post('/create', createBooking);
router.get('/my-bookings', getUserBookings);
router.put('/:bookingId/cancel', cancelBooking);

export default router;
