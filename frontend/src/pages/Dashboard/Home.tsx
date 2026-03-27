import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import SuperAdminDashboard from '../superadminpages/Dashboard';
import FacultyAdminDashboard from '../facultyadminpages/Dashboard';

const Home: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-university-gold-200 border-t-university-gold-500"></div>
      </div>
    );
  }

  if (user.role === USER_ROLES.SUPER_ADMIN) {
    return <SuperAdminDashboard />;
  }

  if (user.role === USER_ROLES.FACULTY_ADMIN) {
    return <FacultyAdminDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          You don't have permission to access this dashboard.
        </p>
      </div>
    </div>
  );
};

export default Home;