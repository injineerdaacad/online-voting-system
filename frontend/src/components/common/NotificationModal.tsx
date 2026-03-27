import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import notificationService from '../../services/notificationService';
import type { Notification } from '../../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      setupRealTimeListeners();
    }
    
    return () => {
      if (isOpen) {
        cleanupRealTimeListeners();
      }
    };
  }, [isOpen]);

  const setupRealTimeListeners = () => {
    if (hasInitialized.current) return;
    
    notificationService.on('new_notification', handleNewNotification);
    notificationService.on('notification_updated', handleNotificationUpdate);
    notificationService.on('notification_deleted', handleNotificationDelete);
    notificationService.on('notifications_updated', handleBulkUpdate);
    
    hasInitialized.current = true;
  };

  const cleanupRealTimeListeners = () => {
    notificationService.off('new_notification', handleNewNotification);
    notificationService.off('notification_updated', handleNotificationUpdate);
    notificationService.off('notification_deleted', handleNotificationDelete);
    notificationService.off('notifications_updated', handleBulkUpdate);
    hasInitialized.current = false;
  };

  const handleNewNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const handleNotificationUpdate = useCallback((data: any) => {
    if (data.type === 'marked_read') {
      setNotifications(prev => 
        prev.map(n => n._id === data.notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const handleNotificationDelete = useCallback((data: any) => {
    setNotifications(prev => {
      const deletedNotification = prev.find(n => n._id === data.notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n._id !== data.notificationId);
    });
  }, []);

  const handleBulkUpdate = useCallback((data: any) => {
    if (data.type === 'all_marked_read') {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [notificationsResponse, unreadCountResponse] = await Promise.all([
        notificationService.getNotifications({ limit: 50 }),
        notificationService.getUnreadCount()
      ]);
      setNotifications(notificationsResponse.notifications || []);
      setUnreadCount(unreadCountResponse || 0);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId);
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading('all');
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setActionLoading(notificationId);
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
    } finally {
      setActionLoading(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.url) {
      navigate(notification.url);
    }
    onClose();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }, []);

  const memoizedNotifications = useMemo(() => notifications, [notifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-start justify-center p-2 sm:p-4 pt-8 sm:pt-16 overflow-y-auto">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 transition-all flex flex-col max-h-[95vh] sm:max-h-[90vh] my-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-university-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading === 'all'}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  {actionLoading === 'all' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  ) : (
                    <Check className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-university-gold-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            ) : memoizedNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {memoizedNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                      !notification.read ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                    } relative`}
                  >
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-university-red-500 rounded-full"></div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="text-left w-full"
                            >
                              <p className={`text-sm font-medium ${
                                !notification.read 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                            </button>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              <div className="flex items-center space-x-1">
                                {!notification.read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification._id)}
                                    disabled={actionLoading === notification._id}
                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                    title="Mark as read"
                                  >
                                    {actionLoading === notification._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-gray-500" />
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(notification._id)}
                                  disabled={actionLoading === notification._id}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                  title="Delete"
                                >
                                  {actionLoading === notification._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No notifications</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
