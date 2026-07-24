import { Router } from 'express';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notification.controller.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Protected user routes
router.get('/my-notifications', authenticateJWT, getMyNotifications);
router.put('/mark-read/:id', authenticateJWT, markNotificationRead);
router.put('/mark-all-read', authenticateJWT, markAllNotificationsRead);

export default router;
