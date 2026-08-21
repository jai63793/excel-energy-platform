import express from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth.js';
import {
  getEmployeeProfile,
  updateDutyStatus,
  updateAvailability,
  checkInAttendance,
  checkOutAttendance,
  getAttendanceHistory,
  getAssignedBookings,
  updateBookingNotes
} from '../controllers/employee.controller.js';

const router = express.Router();

// Require authentication and employee/volunteer/admin roles for all employee routes
router.use(authenticateJWT);
router.use(requireRole(['EMPLOYEE', 'VOLUNTEER', 'ADMIN']));

router.get('/profile', getEmployeeProfile);
router.put('/duty-status', updateDutyStatus);
router.put('/availability', updateAvailability);
router.post('/attendance/check-in', checkInAttendance);
router.post('/attendance/check-out', checkOutAttendance);
router.get('/attendance/history', getAttendanceHistory);
router.get('/bookings', getAssignedBookings);
router.put('/bookings/:bookingId', updateBookingNotes);

export default router;
