import React from 'react';
import { User, Mail, Calendar, Shield, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserInfoCard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-university-gold-100 flex items-center justify-center overflow-hidden">
          {(user as any)?.photo_url ? (
            <img
              src={(user as any).photo_url}
              alt={`${user?.name || 'User'} profile`}
              className="h-full w-full object-cover rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<svg class="h-8 w-8 text-university-gold-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                }
              }}
            />
          ) : (
            <User className="h-8 w-8 text-university-gold-700" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {user?.name || 'User Name'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Mail className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-gray-900 dark:text-white">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Shield className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
            <p className="text-gray-900 dark:text-white">{user?.role || 'User'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Building className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Faculty</p>
            <p className="text-gray-900 dark:text-white">{user?.faculty?.name || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
            <p className="text-gray-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoCard;