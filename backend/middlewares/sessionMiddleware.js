import jwt from 'jsonwebtoken';
import { sessionManager } from '../config/sessionStore.js';
import { User } from '../models/index.js';

export const authenticateSession = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') ||
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }
    const isBlacklisted = await sessionManager.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessionData = await sessionManager.getSession(decoded.sessionId || decoded.id);

    if (!sessionData) {
      return res.status(401).json({
        error: 'Session expired or invalid',
        code: 'SESSION_EXPIRED'
      });
    }
    const user = await User.findById(decoded.id)
      .select('-password_hash')
      .populate('faculty_id', 'name code')
      .populate('department', 'name code')
      .populate('created_by', 'username email role');

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    if (user.is_locked) {
      return res.status(403).json({
        error: 'Account is locked',
        code: 'ACCOUNT_LOCKED'
      });
    }
    await sessionManager.logUserActivity(user._id, 'API_ACCESS', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    await sessionManager.extendSession(decoded.sessionId || decoded.id);
    req.user = {
      id: user._id,
      ...decoded,
      sessionData
    };
    req.userData = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(500).json({
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.userData) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.userData.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.userData.role
      });
    }

    next();
  };
};

export const validateSession = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'No user session found',
        code: 'NO_SESSION'
      });
    }
    const sessionData = await sessionManager.getSession(req.user.id);
    if (!sessionData) {
      return res.status(401).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    const now = new Date();
    const sessionExpiry = new Date(sessionData.expiresAt);

    if (now > sessionExpiry) {
      await sessionManager.deleteSession(req.user.id);
      return res.status(401).json({
        error: 'Session expired',
        code: 'SESSION_EXPIRED'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Session validation failed',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};