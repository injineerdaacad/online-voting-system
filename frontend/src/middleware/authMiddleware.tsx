import React from 'react';
import { AxiosError } from 'axios';

export class AuthMiddleware {
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  static setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  static removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  static hasRole(requiredRoles: string[]): boolean {
    const userData = localStorage.getItem('user');
    if (!userData) return false;
    
    try {
      const user = JSON.parse(userData);
      return requiredRoles.includes(user.role);
    } catch {
      return false;
    }
  }

  static isSuperAdmin(): boolean {
    return this.hasRole(['super-admin']);
  }

  static isFacultyAdmin(): boolean {
    return this.hasRole(['admin']);
  }

  static getCurrentUser(): any {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static handleAuthError(error: AxiosError): boolean {
    if (error.response?.status === 401) {
      this.removeToken();
      window.location.href = '/signin';
      return true;
    }
    return false;
  }

  static async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        this.removeToken();
        return false;
      }
      
      return true;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }
}

export const requireAuth = (requiredRoles?: string[]) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
      const isAuthenticated = AuthMiddleware.isAuthenticated();
      
      if (!isAuthenticated) {
        window.location.href = '/signin';
        return null;
      }

      if (requiredRoles && !AuthMiddleware.hasRole(requiredRoles)) {
        window.location.href = '/dashboard';
        return null;
      }

      return React.createElement(WrappedComponent, props);
    };
  };
};

export const withRole = (requiredRoles: string[]) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    return (props: any) => {
      if (!AuthMiddleware.hasRole(requiredRoles)) {
        return React.createElement('div', null, 'Access Denied');
      }

      return React.createElement(WrappedComponent, props);
    };
  };
};