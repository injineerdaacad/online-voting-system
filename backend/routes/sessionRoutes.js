import express from 'express';
import {
  createSession,
  getCurrentSession,
  extendSession,
  destroySession,
  getUserSessions,
  revokeAllUserSessions
} from '../controllers/index.js';
import {
  authenticateSession,
  validateSession
} from '../middlewares/sessionMiddleware.js';
import { requireSuperAdmin } from '../middlewares/index.js';

const router = express.Router();

router.post('/create', createSession);
router.get('/me', authenticateSession, validateSession, getCurrentSession);
router.post('/extend', authenticateSession, validateSession, extendSession);
router.post('/logout', authenticateSession, destroySession);
router.get('/user/:userId', authenticateSession, requireSuperAdmin, getUserSessions);
router.post('/user/:userId/revoke-all', authenticateSession, requireSuperAdmin, revokeAllUserSessions);

export default router;