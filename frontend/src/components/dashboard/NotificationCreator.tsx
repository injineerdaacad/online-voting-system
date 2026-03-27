import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { notificationService, userService } from '../../services';

interface NotificationCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCreator: React.FC<NotificationCreatorProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    url: '',
    targetUsers: 'all' as 'all' | 'specific',
    specificUserIds: [] as string[],
    userSearch: ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSearch = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await userService.getUsers({ search: query, limit: 10 });
      setUsers(response.data);
    } catch (error) {
    } finally {
      setSearchLoading(false);
    }
  };

  const addUser = (user: any) => {
    if (!formData.specificUserIds.includes(user._id)) {
      setFormData(prev => ({
        ...prev,
        specificUserIds: [...prev.specificUserIds, user._id]
      }));
    }
    setFormData(prev => ({ ...prev, userSearch: '' }));
    setUsers([]);
  };

  const removeUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      specificUserIds: prev.specificUserIds.filter(id => id !== userId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      alert('Please fill in title and message');
      return;
    }

    setLoading(true);
    try {
      const notificationData = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        url: formData.url || undefined,
        metadata: {
          createdBy: 'admin',
          timestamp: new Date().toISOString()
        }
      };

      if (formData.targetUsers === 'all') {
        const allUsersResponse = await userService.getUsers({ limit: 1000 });
        const userIds = allUsersResponse.data.map((user: any) => user._id);
        
        await notificationService.createBulkNotifications({
          user_ids: userIds,
          ...notificationData
        });
      } else {
        if (formData.specificUserIds.length === 0) {
          alert('Please select at least one user');
          return;
        }
        
        await notificationService.createBulkNotifications({
          user_ids: formData.specificUserIds,
          ...notificationData
        });
      }

      alert('Notifications sent successfully!');
      onClose();
      resetForm();
    } catch (error) {
      alert('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      url: '',
      targetUsers: 'all',
      specificUserIds: [],
      userSearch: ''
    });
    setUsers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Notification">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-university-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter notification title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-university-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter notification message"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-university-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL (Optional)
          </label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-university-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="/elections, /results, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Users
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="targetUsers"
                  value="all"
                  checked={formData.targetUsers === 'all'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                All Users
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="targetUsers"
                  value="specific"
                  checked={formData.targetUsers === 'specific'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Specific Users
              </label>
            </div>

            {formData.targetUsers === 'specific' && (
              <div className="space-y-3">
                
                <div>
                  <input
                    type="text"
                    value={formData.userSearch}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, userSearch: e.target.value }));
                      handleUserSearch(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-university-gold-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Search users by name or email..."
                  />

                  {users.length > 0 && (
                    <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 max-h-40 overflow-y-auto">
                      {users.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => addUser(user)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                        >
                          <div className="font-medium">{user.full_name || user.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {formData.specificUserIds.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Users ({formData.specificUserIds.length})
                    </label>
                    <div className="space-y-2">
                      {formData.specificUserIds.map((userId) => {
                        const user = users.find(u => u._id === userId);
                        return (
                          <div key={userId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded-lg">
                            <span>{user?.full_name || user?.name || 'Unknown User'}</span>
                            <button
                              type="button"
                              onClick={() => removeUser(userId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            leftIcon={<Send className="h-4 w-4" />}
          >
            Send Notification{formData.targetUsers === 'all' ? 's' : ''}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NotificationCreator;