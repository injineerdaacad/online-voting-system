import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  faculty?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(API_ENDPOINTS.AUTH.ADMIN_LOGIN, credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await axios.post(API_ENDPOINTS.AUTH.ADMIN_LOGOUT);
  }

  async unlockUser(userId: string): Promise<void> {
    await axios.post(API_ENDPOINTS.AUTH.UNLOCK_USER, { userId });
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem('refreshToken', refreshToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();