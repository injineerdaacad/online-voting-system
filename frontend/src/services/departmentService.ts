import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Department {
  id: string;
  name: string;
  description?: string;
  faculty: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  code?: string;
  description?: string;
  facultyId: string;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
  description?: string;
  facultyId?: string;
}

export interface DepartmentFilters {
  facultyId?: string;
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

class DepartmentService {
  async getDepartments(filters: DepartmentFilters = {}): Promise<PaginatedResponse<Department>> {
    const response = await axios.get(API_ENDPOINTS.DEPARTMENTS.BASE, { params: filters });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    const normalizedData = data.map((dept: any) => ({
      ...dept,
      _id: dept._id || dept.id,
      id: dept.id || dept._id,
    }));
    
    return {
      data: normalizedData,
      total: normalizedData.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(normalizedData.length / (filters.limit || 10)),
    };
  }

  async getDepartmentById(id: string): Promise<Department> {
    const response = await axios.get(`${API_ENDPOINTS.DEPARTMENTS.BASE}/${id}`);
    return response.data;
  }

  async createDepartment(departmentData: CreateDepartmentData): Promise<Department> {
    const backendData: any = {
      name: departmentData.name,
      faculty_id: departmentData.facultyId,
    };
    if (departmentData.code) backendData.code = departmentData.code;
    if (departmentData.description) backendData.description = departmentData.description;
    
    const response = await axios.post(API_ENDPOINTS.DEPARTMENTS.ADD, backendData);
    return response.data.department || response.data;
  }

  async updateDepartment(id: string, departmentData: UpdateDepartmentData): Promise<Department> {
    const backendData: any = {};
    if (departmentData.name) backendData.name = departmentData.name;
    if (departmentData.code) backendData.code = departmentData.code;
    if (departmentData.description !== undefined) backendData.description = departmentData.description;
    if (departmentData.facultyId) backendData.faculty_id = departmentData.facultyId;
    
    const response = await axios.put(`${API_ENDPOINTS.DEPARTMENTS.BASE}/${id}`, backendData);
    return response.data.department || response.data;
  }

  async deleteDepartment(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.DEPARTMENTS.BASE}/${id}`);
  }
}

export default new DepartmentService();
