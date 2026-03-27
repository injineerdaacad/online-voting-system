import { BaseService } from './baseService';
import { API_ENDPOINTS } from '../utils/constants';
import { formatAdminOutput } from '../utils/formatters';

export class AdminService extends BaseService {
  constructor() {
    super(API_ENDPOINTS.USERS.BASE);
  }

  async getAdmins(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const response = await this.getAll(params);
    return {
      ...response,
      data: response.data.map(formatAdminOutput)
    };
  }

  async getAdminById(id: string) {
    const response = await this.getById(id);
    return {
      ...response,
      data: formatAdminOutput(response.data)
    };
  }

  async createAdmin(adminData: {
    username: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    faculty_id?: string;
    department?: string;
  }) {
    const response = await this.create(adminData);
    return {
      ...response,
      data: formatAdminOutput(response.data)
    };
  }

  async updateAdmin(id: string, adminData: {
    username?: string;
    email?: string;
    phone?: string;
    role?: string;
    faculty_id?: string;
    department?: string;
  }) {
    const response = await this.update(id, adminData);
    return {
      ...response,
      data: formatAdminOutput(response.data)
    };
  }

  async deleteAdmin(id: string) {
    return await this.deleteById(id);
  }

  async lockAdmin(id: string) {
    return await this.post(`/${id}/lock`);
  }

  async unlockAdmin(id: string) {
    return await this.post(`/${id}/unlock`);
  }

  async getLockedAdmins(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const response = await this.get(API_ENDPOINTS.USERS.LOCKED, params);
    return {
      ...response,
      data: response.data.map(formatAdminOutput)
    };
  }

  async resetPassword(id: string, newPassword: string) {
    return await this.patch(API_ENDPOINTS.USERS.RESET_PASSWORD(id), {
      password: newPassword
    });
  }
}

export default AdminService;
