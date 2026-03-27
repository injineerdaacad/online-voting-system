import { Navigate } from 'react-router-dom';
import { AuthMiddleware } from './authMiddleware';
import { USER_ROLES } from '../utils/constants';

export interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  requiredRoles?: string[];
  redirectTo?: string;
  exact?: boolean;
}

export const createRouteGuard = (config: RouteConfig) => {
  return (props: any) => {
    if (!AuthMiddleware.isAuthenticated()) {
      return <Navigate to={config.redirectTo || '/signin'} replace />;
    }

    if (config.requiredRoles && !AuthMiddleware.hasRole(config.requiredRoles)) {
      return <Navigate to="/dashboard" replace />;
    }

    return <config.component {...props} />;
  };
};

export const withRoleGuard = (requiredRoles: string[]) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
      if (!AuthMiddleware.hasRole(requiredRoles)) {
        return <Navigate to="/dashboard" replace />;
      }
      return <WrappedComponent {...props} />;
    };
  };
};

export const withAuthGuard = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => {
    if (!AuthMiddleware.isAuthenticated()) {
      return <Navigate to="/signin" replace />;
    }
    return <WrappedComponent {...props} />;
  };
};

export const withSuperAdminGuard = (WrappedComponent: React.ComponentType<any>) => {
  return withRoleGuard([USER_ROLES.SUPER_ADMIN])(WrappedComponent);
};

export const withFacultyAdminGuard = (WrappedComponent: React.ComponentType<any>) => {
  return withRoleGuard([USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN])(WrappedComponent);
};

export const createRouteConfig = (
  path: string,
  component: React.ComponentType<any>,
  options: {
    requiredRoles?: string[];
    redirectTo?: string;
    exact?: boolean;
  } = {}
): RouteConfig => ({
  path,
  component,
  ...options
});

export const createRouteGroup = (
  basePath: string,
  routes: Omit<RouteConfig, 'path'>[],
  groupOptions: {
    requiredRoles?: string[];
    redirectTo?: string;
  } = {}
): RouteConfig[] => {
  return routes.map(route => ({
    ...route,
    path: `${basePath}${route.path || ''}`,
    requiredRoles: route.requiredRoles || groupOptions.requiredRoles,
    redirectTo: route.redirectTo || groupOptions.redirectTo,
  }));
};

export const navigationGuard = (to: string, from: string): boolean => {
  const protectedRoutes = ['/admins', '/faculties', '/departments', '/students', '/elections', '/candidates'];
  const isProtectedRoute = protectedRoutes.some(route => to.startsWith(route));
  
  if (isProtectedRoute && !AuthMiddleware.isAuthenticated()) {
    return false;
  }
  
  return true;
};

export const canAccessRoute = (path: string): boolean => {
  const routePermissions: Record<string, string[]> = {
    '/admins': [USER_ROLES.SUPER_ADMIN],
    '/locked-admins': [USER_ROLES.SUPER_ADMIN],
    '/faculties': [USER_ROLES.SUPER_ADMIN],
    '/departments': [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    '/students': [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    '/elections': [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    '/candidates': [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
    '/results': [USER_ROLES.SUPER_ADMIN, USER_ROLES.FACULTY_ADMIN],
  };

  const requiredRoles = routePermissions[path];
  if (!requiredRoles) return true;
  
  return AuthMiddleware.hasRole(requiredRoles);
};

export const isMenuItemVisible = (path: string): boolean => {
  return canAccessRoute(path);
};

export const generateBreadcrumbs = (path: string): Array<{ label: string; href?: string }> => {
  const pathSegments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }];
  
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    });
  });
  
  return breadcrumbs;
};

export default {
  createRouteGuard,
  withRoleGuard,
  withAuthGuard,
  withSuperAdminGuard,
  withFacultyAdminGuard,
  createRouteConfig,
  createRouteGroup,
  navigationGuard,
  canAccessRoute,
  isMenuItemVisible,
  generateBreadcrumbs,
};