import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { Menu, Bell } from 'lucide-react';
import UserDropdown from './UserDropdown';
import NotificationModal from '../common/NotificationModal';
import { useNotifications } from '../../hooks/useNotifications';
import { ROUTES } from '../../utils/constants';

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { } = useAuth();
  const { toggleSidebar, isOpen } = useSidebar();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { unreadCount } = useNotifications();

  const handleLogoClick = () => {
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <header className="bg-white dark:bg-slate-900 shadow-xl border-b border-university-gold-200/60 dark:border-slate-700 fixed top-0 left-0 right-0 z-50 w-full">
      <div className={`flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 w-full ${
        isOpen ? 'lg:pl-72' : 'lg:pl-28 sm:pl-20'
      }`}>
        
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-university-gold-100 dark:hover:bg-university-gold-900/30 transition-all duration-200 hover:shadow-md flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-university-gold-600 dark:text-university-gold-400" />
          </button>
          
          <button 
            onClick={handleLogoClick}
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-all duration-200 hover:scale-105 flex-shrink-0"
            title="Go to Dashboard"
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-university-gold-500 to-university-blue-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex-shrink-0">
              <img 
                src="/images/brand/Logo.png" 
                alt="SNU Logo" 
                className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div className="hidden sm:block flex-shrink-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-university-gold-600 dark:text-university-gold-400 leading-tight whitespace-nowrap">
                <span className="hidden md:inline">Online Voting System</span>
                <span className="md:hidden">OVS</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-university-blue-600 dark:text-university-blue-400 uppercase tracking-wide whitespace-nowrap">
                <span className="hidden lg:inline">SOMALIA NATIONAL UNIVERSITY</span>
                <span className="lg:hidden">SNU</span>
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
          
          <button 
            onClick={() => setShowNotificationModal(true)}
            className="p-1.5 sm:p-2.5 rounded-xl hover:bg-university-gold-100 dark:hover:bg-university-gold-900/30 transition-all duration-200 hover:shadow-md relative flex-shrink-0"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-university-gold-600 dark:text-university-gold-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 sm:h-6 sm:w-6 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 z-20 min-w-[1.25rem] sm:min-w-[1.5rem]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <UserDropdown />
        </div>
      </div>

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </header>
  );
};

export default AppHeader;