import { AxiosResponse } from 'axios';
import api from '../utils/axios';
import { handleControllerError } from '../utils/controllerHelpers';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class BaseService {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  protected async get<T = any>(
    path: string = '', 
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await api.get(
        `${this.endpoint}${path}`,
        { params }
      );
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw handleControllerError(error);
    }
  }

  protected async post<T = any>(
    path: string = '', 
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await api.post(
        `${this.endpoint}${path}`,
        data
      );
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw handleControllerError(error);
    }
  }

  protected async put<T = any>(
    path: string = '', 
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await api.put(
        `${this.endpoint}${path}`,
        data
      );
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw handleControllerError(error);
    }
  }

  protected async patch<T = any>(
    path: string = '', 
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await api.patch(
        `${this.endpoint}${path}`,
        data
      );
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw handleControllerError(error);
    }
  }

  protected async delete<T = any>(
    path: string = ''
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await api.delete(
        `${this.endpoint}${path}`
      );
      return {
        data: response.data,
        status: response.status
      };
    } catch (error) {
      throw handleControllerError(error);
    }
  }

  async getAll(params?: PaginationParams): Promise<PaginatedResponse<any>> {
    const response = await this.get('', params);
    return response.data;
  }

  async getById(id: string): Promise<ApiResponse<any>> {
    return await this.get(`/${id}`);
  }

  async create(data: any): Promise<ApiResponse<any>> {
    return await this.post('', data);
  }

  async update(id: string, data: any): Promise<ApiResponse<any>> {
    return await this.put(`/${id}`, data);
  }

  async deleteById(id: string): Promise<ApiResponse<any>> {
    return await this.delete(`/${id}`);
  }

  async search(query: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
    const searchParams = { ...params, search: query };
    return await this.getAll(searchParams);
  }
}

export default BaseService;
