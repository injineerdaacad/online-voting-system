import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface User {
  id: string;
  _id?: string;
  name?: string;
  full_name?: string;
  username?: string;
  student_id?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  faculty?: {
    id: string;
    name: string;
  };
  faculty_id?: {
    _id: string;
    name: string;
    code?: string;
  };
  department?: {
    id: string;
    name: string;
  };
  batch?: string;
  graduation_year?: number;
  has_voted?: Array<{
    election_id: {
      _id: string;
      title: string;
    };
    voted_at: string;
  }>;
  attempt_login?: number;
  attempt_login_time?: string;
  is_locked?: boolean;
  is_login?: boolean;
  last_login?: string;
  last_logout?: string;
  photo?: string;
  photo_url?: string;
  photo_id?: string;
  created_by?: {
    _id: string;
    username?: string;
    email?: string;
  };
  updated_by?: {
    _id: string;
    username?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
  role: string;
  faculty_id?: string;
  department?: string;
  batch?: string;
  graduation_year?: number;
}

export interface UpdateUserData {
  name?: string;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  facultyId?: string;
  departmentId?: string;
}

export interface PasswordChangeData {
  password: string;
  confirm_password: string;
}

export interface PasswordResetData {
  password: string;
  confirm_password: string;
}

export interface UserFilters {
  role?: string;
  status?: string;
  facultyId?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class UserService {
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await axios.get(API_ENDPOINTS.USERS.BASE, { params: filters });
    return response.data;
  }

  async getAdmins(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await axios.get(API_ENDPOINTS.USERS.BASE, { params: filters });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    const normalizedData = data.map((user: any) => ({
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id,
      faculty_id: user.faculty_id,
    }));
    
    return {
      data: normalizedData,
      total: normalizedData.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(normalizedData.length / (filters.limit || 10)),
    };
  }

  async getStudents(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await axios.get(API_ENDPOINTS.USERS.BASE, { 
      params: { ...filters, role: 'Student' }
    });
    
    let data = Array.isArray(response.data) ? response.data : [];
    
    data = data.filter((user: any) => user.role === 'Student');
    
    const normalizedData = data.map((user: any) => ({
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id,
      photo_url: user.photo_url || null,
    }));
    
    return {
      data: normalizedData,
      total: normalizedData.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(normalizedData.length / (filters.limit || 10)),
    };
  }

  async getLockedUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await axios.get(API_ENDPOINTS.USERS.LOCKED, { params: filters });

    let data = Array.isArray(response.data) ? response.data : [];

    if (data.length === 0) {
      try {
        const allAdmins = await this.getAdmins(filters);
        data = allAdmins.data.filter((user: any) => {
          const status = (user.status || '').toLowerCase();
          return user.is_locked === true || status === 'suspended';
        });
      } catch (e) {
      }
    }

    const normalizedData = data.map((user: any) => ({
      ...user,
      _id: user._id || user.id,
      id: user.id || user._id,
      faculty: user.faculty || user.faculty_id,
    }));

    return {
      data: normalizedData,
      total: normalizedData.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(normalizedData.length / (filters.limit || 10)),
    };
  }

  async getUserById(id: string): Promise<User> {
    const response = await axios.get(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.data;
  }

  async getCurrentUserProfile(): Promise<User> {
    const response = await axios.get(`${API_ENDPOINTS.USERS.BASE}/profile`);
    return response.data.user;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await axios.post(API_ENDPOINTS.USERS.BASE, userData);
    return response.data;
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    const response = await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}`, userData);
    return response.data;
  }

  async updateCurrentUserProfile(userData: UpdateUserData, photoFile?: File): Promise<User> {
    const formData = new FormData();
    
    if (userData.full_name) formData.append('full_name', userData.full_name);
    if (userData.username) formData.append('username', userData.username);
    if (userData.email) formData.append('email', userData.email);
    if (userData.phone) formData.append('phone', userData.phone);
    
    if (photoFile) {
      formData.append('photo', photoFile);
    }
    
    const response = await axios.put(`${API_ENDPOINTS.USERS.BASE}/profile`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.user;
  }

  async deleteUser(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.USERS.BASE}/${id}`);
  }

  async lockUser(id: string): Promise<User> {
    const response = await axios.patch(`${API_ENDPOINTS.USERS.BASE}/${id}/lock`);
    return response.data.user;
  }

  async unlockUser(id: string): Promise<User> {
    const response = await axios.patch(`${API_ENDPOINTS.USERS.BASE}/${id}/unlock`);
    return response.data.user;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}/password`, {
      currentPassword,
      newPassword,
    });
  }

  async changePasswordWithData(id: string, passwordData: PasswordChangeData): Promise<void> {
    await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}/password`, passwordData);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}/reset-password`, {
      newPassword,
    });
  }

  async resetPasswordWithData(id: string, passwordData: PasswordResetData): Promise<void> {
    await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}/reset-password`, passwordData);
  }

  async addAdmin(adminData: FormData | Partial<User>): Promise<User> {
    const response = await axios.post(`${API_ENDPOINTS.USERS.ADD}`, adminData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateAdmin(id: string, adminData: Partial<User> | FormData): Promise<User> {
    const headers = adminData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' }
      : { 'Content-Type': 'application/json' };
    
    const response = await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}`, adminData, { headers });
    return response.data;
  }

  async getAdminById(id: string): Promise<User> {
    const response = await axios.get(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.data;
  }

  async checkStudentInUniversityAPI(student_id: string): Promise<{
    exists_in_api: boolean;
    can_auto_register?: boolean;
    student_data?: {
      student_id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      batch?: string | null;
      graduation_year?: number | null;
      photo_url?: string | null;
      faculty: {
        name: string | null;
        code: string | null;
        exists_in_system: boolean;
        faculty_id: string | null;
      };
      department: {
        name: string | null;
        code: string | null;
        exists_in_system: boolean;
        department_id: string | null;
      };
    };
    message?: string;
    api_unavailable?: boolean;
  }> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.USERS.BASE}/check/${student_id}`);
      return response.data;
    } catch (error: any) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async searchStudentIds(query: string): Promise<{ student_ids: Array<{ student_id: string; full_name?: string }> }> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.USERS.BASE}/search-student-ids`, {
        params: { query }
      });
      return response.data;
    } catch (error: any) {
      console.error('Autocomplete API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        throw error;
      }
      
      throw error;
    }
  }
}

export default new UserService();
