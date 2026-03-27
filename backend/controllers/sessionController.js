import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { sessionManager } from '../config/sessionStore.js';
import { User } from '../models/index.js';
import { handleControllerError } from '../utils/controllerHelpers.js';

export const createSession = async (req, res) => {
  try {
    const { user, token } = req.body;

    if (!user || !token) {
      return res.status(400).json({
        error: 'User data and token are required',
        code: 'MISSING_DATA'
      });
    }
    const sessionId = uuidv4();
    const sessionData = {
      sessionId,
      userId: user.id,
      userRole: user.role,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      isActive: true
    };
    const sessionStored = await sessionManager.setSession(sessionId, sessionData, 86400);

    if (!sessionStored) {
      return res.status(500).json({
        error: 'Failed to create session',
        code: 'SESSION_CREATE_FAILED'
      });
    }
    await sessionManager.logUserActivity(user.id, 'LOGIN', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId
    });
    const enhancedToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        faculty_id: user.faculty_id,
        department: user.department,
        sessionId: sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.cookie('token', enhancedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({
      success: true,
      token: enhancedToken,
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        faculty_id: user.faculty_id,
        department: user.department
      },
      session: {
        sessionId,
        expiresAt: sessionData.expiresAt,
        loginTime: sessionData.loginTime
      }
    });

  } catch (error) {
    return handleControllerError(res, error, 'Session creation failed');
  }
};

export const getCurrentSession = async (req, res) => {
  try {
    const sessionId = req.user.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        error: 'No active session',
        code: 'NO_SESSION'
      });
    }

    const sessionData = await sessionManager.getSession(sessionId);

    if (!sessionData) {
      return res.status(401).json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }
    const activities = await sessionManager.getUserActivity(req.user.id, 10);

    res.json({
      success: true,
      session: {
        sessionId: sessionData.sessionId,
        loginTime: sessionData.loginTime,
        lastActivity: sessionData.lastActivity,
        expiresAt: sessionData.expiresAt,
        isActive: sessionData.isActive,
        ip: sessionData.ip
      },
      user: req.userData,
      recentActivity: activities
    });

  } catch (error) {
    return handleControllerError(res, error, 'Failed to get session info');
  }
};

export const extendSession = async (req, res) => {
  try {
    const sessionId = req.user.sessionId;

    if (!sessionId) {
      return res.status(401).json({
        error: 'No active session',
        code: 'NO_SESSION'
      });
    }
    const extended = await sessionManager.extendSession(sessionId, 86400);

    if (!extended) {
      return res.status(500).json({
        error: 'Failed to extend session',
        code: 'SESSION_EXTEND_FAILED'
      });
    }
    await sessionManager.logUserActivity(req.user.id, 'SESSION_EXTENDED', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Session extended successfully',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    return handleControllerError(res, error, 'Failed to extend session');
  }
};

export const destroySession = async (req, res) => {
  try {
    const sessionId = req.user.sessionId;
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    if (sessionId) {
      await sessionManager.deleteSession(sessionId);
    }
    if (token) {
      await sessionManager.blacklistToken(token, 86400);
    }
    await sessionManager.logUserActivity(req.user.id, 'LOGOUT', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId
    });
    await User.findByIdAndUpdate(req.user.id, {
      is_login: false,
      last_logout: new Date()
    });
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    return handleControllerError(res, error, 'Logout failed');
  }
};

export const getUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.userData.role !== 'Super Admin' && req.user.id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    const activities = await sessionManager.getUserActivity(userId, 50);
    const loginActivities = activities.filter(activity =>
      activity.activity === 'LOGIN' || activity.activity === 'API_ACCESS'
    );

    res.json({
      success: true,
      sessions: loginActivities,
      total: loginActivities.length
    });

  } catch (error) {
    return handleControllerError(res, error, 'Failed to get user sessions');
  }
};

export const revokeAllUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.userData.role !== 'Super Admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    const activities = await sessionManager.getUserActivity(userId, 100);
    const loginActivities = activities.filter(activity => activity.activity === 'LOGIN');
    for (const activity of loginActivities) {
      if (activity.metadata.sessionId) {
        await sessionManager.deleteSession(activity.metadata.sessionId);
      }
    }
    await sessionManager.logUserActivity(req.user.id, 'REVOKE_ALL_SESSIONS', {
      targetUserId: userId,
      revokedSessions: loginActivities.length
    });

    res.json({
      success: true,
      message: `Revoked ${loginActivities.length} sessions for user`,
      revokedCount: loginActivities.length
    });

  } catch (error) {
    return handleControllerError(res, error, 'Failed to revoke user sessions');
  }
};