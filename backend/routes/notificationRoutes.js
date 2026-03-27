import express from 'express';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createBulkNotifications
} from '../controllers/index.js';
import { authenticateJWT } from '../middlewares/index.js';
import { requireAdmin } from '../middlewares/index.js';

const router = express.Router();

router.use(authenticateJWT);
router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/', requireAdmin, createNotification);
router.post('/bulk', requireAdmin, createBulkNotifications);

export default router;