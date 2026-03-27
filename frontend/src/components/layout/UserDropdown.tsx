import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

const UserDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dropdownImageError, setDropdownImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getPhotoUrl = () => {
    if (!user) {
      return null;
    }
    
    const photoUrl = (user as any)?.photo_url;
    
    if (!photoUrl || photoUrl === '' || photoUrl === null || photoUrl === undefined) {
      return null;
    }
    
    return typeof photoUrl === 'string' ? photoUrl : null;
  };

  const userPhoto = getPhotoUrl();
  
  const getUserName = () => {
    if (!user) {
      return 'User';
    }
    
    const username = (user as any)?.username || 
                     (user as any)?.full_name || 
                     'User';
    
    return username && username.trim() !== '' ? username : 'User';
  };
  
  const userName = getUserName();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.SIGNIN);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    setImageError(false);
    setDropdownImageError(false);
  }, [user, userPhoto]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-xl hover:bg-university-gold-100 dark:hover:bg-university-gold-900/30 transition-all duration-200 hover:shadow-md"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-university-gold-500 to-university-blue-600 flex items-center justify-center shadow-md overflow-hidden ring-2 ring-white dark:ring-slate-800">
          {userPhoto && !imageError ? (
            <img
              src={userPhoto}
              alt={`${userName} profile`}
              className="h-full w-full object-cover"
              onError={() => {
                setImageError(true);
              }}
              onLoad={() => {
                setImageError(false);
              }}
            />
          ) : (
            <FontAwesomeIcon icon={faUser} className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {userName}
          </div>
          <div className="text-xs text-university-gold-600 dark:text-university-gold-400 font-medium capitalize">
            {user?.role || 'Admin'}
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-university-gold-600 dark:text-university-gold-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-university-gold-200/50 dark:border-slate-700 z-50 overflow-hidden backdrop-blur-md">
          <div className="py-2">
            
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-university-gold-500 to-university-blue-600 flex items-center justify-center shadow-md overflow-hidden ring-2 ring-university-gold-200 dark:ring-university-gold-800">
                  {userPhoto && !dropdownImageError ? (
                    <img
                      src={userPhoto}
                      alt={`${userName} profile`}
                      className="h-full w-full object-cover"
                      onError={() => {
                        setDropdownImageError(true);
                      }}
                      onLoad={() => {
                        setDropdownImageError(false);
                      }}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faUser} className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-university-gold-600 dark:text-university-gold-400 font-medium capitalize mt-0.5">
                    {user?.role || 'Admin'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                navigate(ROUTES.PROFILE);
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-university-gold-50 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-3 text-university-gold-600 dark:text-university-gold-400" />
              Profile
            </button>
            
            <hr className="my-1 border-gray-200 dark:border-gray-700" />
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;