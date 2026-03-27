import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { 
  Home, 
  Users, 
  Building, 
  Vote, 
  UserCheck, 
  BarChart3,
  Lock,
  UserPlus,
  X
} from 'lucide-react';
import { ROUTES, USER_ROLES } from '../../utils/constants';

const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const location = useLocation();

  const handleLogoClick = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: ROUTES.DASHBOARD,
      icon: Home,
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    },
    {
      name: 'Admins',
      href: ROUTES.ADMINS,
      icon: Users,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      name: 'Locked Admins',
      href: ROUTES.LOCKED_ADMINS,
      icon: Lock,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      name: 'Faculties',
      href: ROUTES.FACULTIES,
      icon: Building,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      name: 'Departments',
      href: ROUTES.DEPARTMENTS,
      icon: Building,
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    },
    {
      name: 'Students',
      href: ROUTES.STUDENTS,
      icon: UserPlus,
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    },
    {
      name: 'Elections',
      href: ROUTES.ELECTIONS,
      icon: Vote,
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    },
    {
      name: 'Candidates',
      href: ROUTES.CANDIDATES,
      icon: UserCheck,
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    },
    {
      name: 'Results',
      href: ROUTES.RESULTS,
      icon: BarChart3,
      roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    },
  ];

  const filteredItems = navigationItems.filter(item => 
    user?.role && item.roles.includes(user.role as typeof USER_ROLES.SUPER_ADMIN)
  );

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-white via-university-gold-50/20 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-r border-university-gold-200/50 dark:border-slate-700 transition-all duration-300 z-40 shadow-xl ${
        isOpen ? 'w-64 translate-x-0' : 'w-0 sm:w-16 lg:w-20 -translate-x-full sm:translate-x-0'
      }`}>
      
      <div className={`h-12 sm:h-16 flex items-center border-b border-university-gold-200/50 dark:border-slate-700 ${
        isOpen ? 'px-2 sm:px-4 justify-between' : 'px-0 justify-center'
      }`}>
        <button 
          onClick={handleLogoClick}
          className={`flex items-center hover:opacity-80 transition-opacity ${
            isOpen ? 'space-x-2' : ''
          }`}
          title="Go to Dashboard"
        >
          {isOpen ? (
            <>
              <img 
                src="/images/brand/Logo.png" 
                alt="SNU Logo" 
                className="h-9 w-auto"
              />
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  Online Voting System
                </h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Somalia National University
                </p>
              </div>
            </>
          ) : (
            <img 
              src="/images/brand/Logo.png" 
              alt="SNU" 
              className="h-9 w-auto"
              title="Somalia National University - Go to Dashboard"
            />
          )}
        </button>

        {isOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      <nav className="h-[calc(100vh-4rem)] overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const _active = isActive(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105
                  ${isActive 
                    ? 'bg-gradient-to-r from-university-gold-100 to-university-gold-50 text-university-gold-700 dark:from-university-gold-900/40 dark:to-university-gold-800/30 dark:text-university-gold-300 shadow-lg' 
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-university-gold-50/50 hover:to-university-blue-50/50 dark:text-gray-100 dark:hover:bg-gradient-to-r dark:hover:from-slate-700 dark:hover:to-slate-600'
                  }
                `}
                title={!isOpen ? item.name : undefined}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isOpen ? 'mr-3' : 'mx-auto'} text-gray-700 dark:text-gray-200 transition-colors duration-200`} />
                {isOpen && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
    </>
  );
};

export default AppSidebar;