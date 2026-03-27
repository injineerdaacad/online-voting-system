import { Notification } from '../models/index.js';
import { io } from '../config/socketConfig.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const result = await Notification.getUserNotifications(userId, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    io.to(`user_${userId}`).emit('notification_updated', {
      type: 'marked_read',
      notificationId: id
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.markAllAsRead(userId);
    io.to(`user_${userId}`).emit('notifications_updated', {
      type: 'all_marked_read'
    });

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: 'All notifications marked as read'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.deleteNotification(id, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    io.to(`user_${userId}`).emit('notification_deleted', {
      notificationId: id
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Notification deleted successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type = 'info', url, metadata } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, title, message'
      });
    }

    const notification = await Notification.createNotification(user_id, {
      title,
      message,
      type,
      url,
      metadata
    });
    io.to(`user_${user_id}`).emit('new_notification', notification);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

export const createBulkNotifications = async (req, res) => {
  try {
    const { user_ids, title, message, type = 'info', url, metadata } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_ids (array), title, message'
      });
    }

    const notifications = [];
    const errors = [];

    for (const userId of user_ids) {
      try {
        const notification = await Notification.createNotification(userId, {
          title,
          message,
          type,
          url,
          metadata
        });
        notifications.push(notification);
        io.to(`user_${userId}`).emit('new_notification', notification);
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        created: notifications.length,
        errors: errors.length,
        notifications,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk notifications',
      error: error.message
    });
  }
};