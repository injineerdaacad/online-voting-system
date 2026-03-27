import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Faculty {
  id: string;
  name: string;
  code?: string;
  description?: string;
  departments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacultyData {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateFacultyData {
  name?: string;
  code?: string;
  description?: string;
}

export interface FacultyFilters {
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

class FacultyService {
  async getFaculties(filters: FacultyFilters = {}): Promise<PaginatedResponse<Faculty>> {
    const response = await axios.get(API_ENDPOINTS.FACULTIES.BASE, { params: filters });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    return {
      data,
      total: data.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(data.length / (filters.limit || 10)),
    };
  }

  async getFacultyById(id: string): Promise<Faculty> {
    const response = await axios.get(`${API_ENDPOINTS.FACULTIES.BASE}/${id}`);
    return response.data;
  }

  async createFaculty(facultyData: CreateFacultyData): Promise<Faculty> {
    const response = await axios.post(API_ENDPOINTS.FACULTIES.ADD, facultyData);
    return response.data;
  }

  async updateFaculty(id: string, facultyData: UpdateFacultyData): Promise<Faculty> {
    const response = await axios.put(`${API_ENDPOINTS.FACULTIES.BASE}/${id}`, facultyData);
    return response.data;
  }

  async deleteFaculty(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.FACULTIES.BASE}/${id}`);
  }
}

export default new FacultyService();
