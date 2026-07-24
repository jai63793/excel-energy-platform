import { Router } from 'express';
import { 
  getDashboardStats, 
  getUsers, 
  getUserDetails, 
  suspendUser, 
  activateUser, 
  resetUserPassword, 
  deleteUser, 
  getAllPayments, 
  getRevenueReport, 
  getSettings, 
  updateSettings, 
  getActivityLogs,
  getEmployeesAndVolunteers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  getAllAttendanceLogs,
  createLiveSession,
  broadcastLiveSessionAlert,
  getAdminBookings
} from '../controllers/admin.controller.js';
import { sendBulkNotification, sendYouTubeLive } from '../controllers/notification.controller.js';
import { getContactForms, markContactFormRead, deleteContactForm } from '../controllers/contact.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply administrative protections to all endpoints below
router.use(authenticateJWT);
router.use(requireRole(['ADMIN']));

// 1. Dashboard statistics
router.get('/stats', getDashboardStats);

// 2. User Accounts Management
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/suspend/:id', suspendUser);
router.put('/users/activate/:id', activateUser);
router.put('/users/reset-password/:id', resetUserPassword);
router.delete('/users/:id', deleteUser);

// Staff & Volunteer Management
router.get('/staff', getEmployeesAndVolunteers);
router.post('/staff', createStaffMember);
router.put('/staff/:id', updateStaffMember);
router.delete('/staff/:id', deleteStaffMember);
router.get('/attendance', getAllAttendanceLogs);

// Live Sessions Control
router.post('/live-sessions', createLiveSession);
router.put('/live-sessions/:sessionId/broadcast', broadcastLiveSessionAlert);

// Bookings Control
router.get('/bookings', getAdminBookings);

// 3. System Payments
router.get('/payments', getAllPayments);

// 4. Analytics Reports
router.get('/revenue-report', getRevenueReport);

// 5. Global Config Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// 6. Contact Inquiries Inbox
router.get('/contacts', getContactForms);
router.put('/contacts/read/:id', markContactFormRead);
router.delete('/contacts/:id', deleteContactForm);

// 7. System Broadcasts
router.post('/notify-bulk', sendBulkNotification);
router.post('/notify-live', sendYouTubeLive);

// 8. Audits
router.get('/activity-logs', getActivityLogs);

export default router;
