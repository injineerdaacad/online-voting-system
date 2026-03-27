import React from 'react';
import { Settings, Key, Bell, Shield } from 'lucide-react';

interface UserMetaCardProps {
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  onNotificationSettings?: () => void;
  onPrivacySettings?: () => void;
}

const UserMetaCard: React.FC<UserMetaCardProps> = ({
  onEditProfile,
  onChangePassword,
  onNotificationSettings,
  onPrivacySettings,
}) => {
  const actions = [
    {
      title: 'Edit Profile',
      description: 'Update your personal information',
      icon: Settings,
      onClick: onEditProfile,
      color: 'text-university-gold-500',
      bgColor: 'bg-university-gold-100',
    },
    {
      title: 'Change Password',
      description: 'Update your account password',
      icon: Key,
      onClick: onChangePassword,
      color: 'text-university-blue-500',
      bgColor: 'bg-university-blue-100',
    },
    {
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      onClick: onNotificationSettings,
      color: 'text-university-red-500',
      bgColor: 'bg-university-red-100',
    },
    {
      title: 'Privacy',
      description: 'Control your privacy settings',
      icon: Shield,
      onClick: onPrivacySettings,
      color: 'text-university-pink-500',
      bgColor: 'bg-university-pink-100',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Account Settings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className={`p-2 rounded-lg ${action.bgColor}`}>
                <Icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default UserMetaCard;