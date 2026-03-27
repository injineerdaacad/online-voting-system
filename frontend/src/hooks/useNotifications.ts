import { useState, useEffect, useCallback } from 'react';
import notificationService, { type Notification } from '../services/notificationService';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const handleNewNotification = (notification: Notification) => {
      setUnreadCount(prev => prev + 1);
    };

    const handleNotificationUpdate = (data: any) => {
      if (data.type === 'marked_read') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleNotificationDelete = (data: any) => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleBulkUpdate = (data: any) => {
      if (data.type === 'all_marked_read') {
        setUnreadCount(0);
      }
    };

    notificationService.on('new_notification', handleNewNotification);
    notificationService.on('notification_updated', handleNotificationUpdate);
    notificationService.on('notification_deleted', handleNotificationDelete);
    notificationService.on('notifications_updated', handleBulkUpdate);

    return () => {
      notificationService.off('new_notification', handleNewNotification);
      notificationService.off('notification_updated', handleNotificationUpdate);
      notificationService.off('notification_deleted', handleNotificationDelete);
      notificationService.off('notifications_updated', handleBulkUpdate);
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  };
};