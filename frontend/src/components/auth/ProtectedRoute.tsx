import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  redirectTo = '/signin'
}) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-university-gold-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (user && (user.role === USER_ROLES.STUDENT || user.role === 'Student')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Students can only access the system via mobile application.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Web access is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export const withRoleProtection = (requiredRoles: string[]) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

export const SuperAdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN]}>
    {children}
  </ProtectedRoute>
);

export const FacultyAdminOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN]}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;