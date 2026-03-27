import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Election {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
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

export interface CreateElectionData {
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  facultyId?: string;
  departmentId?: string;
}

export interface UpdateElectionData {
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  facultyId?: string;
  departmentId?: string;
}

export interface ElectionFilters {
  type?: string;
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

class ElectionService {
  async getElections(filters: ElectionFilters = {}): Promise<PaginatedResponse<Election>> {
    const backendFilters: any = {};
    if (filters.type) backendFilters.type = filters.type;
    if (filters.status) backendFilters.status = filters.status;
    if (filters.facultyId) backendFilters.faculty_id = filters.facultyId;
    if (filters.search) backendFilters.search = filters.search;
    if (filters.page) backendFilters.page = filters.page;
    if (filters.limit) backendFilters.limit = filters.limit;
    
    const response = await axios.get(API_ENDPOINTS.ELECTIONS.BASE, { params: backendFilters });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    const normalizedData = data.map((election: any) => {
      const faculty = election.faculty_id;
      const facultyId = typeof faculty === 'object' && faculty?._id 
        ? faculty._id.toString() 
        : (typeof faculty === 'string' ? faculty : election.facultyId);
      
      return {
        ...election,
        _id: election._id || election.id,
        id: election.id || election._id,
        startDate: election.start_time || election.startDate,
        endDate: election.end_time || election.endDate,
        facultyId: facultyId,
        faculty: typeof faculty === 'object' ? faculty : (election.faculty || null),
      };
    });
    
    return {
      data: normalizedData,
      total: normalizedData.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(normalizedData.length / (filters.limit || 10)),
    };
  }

  async getEligibleElections(studentId: string): Promise<Election[]> {
    const endpoint = API_ENDPOINTS.ELECTIONS.ELIGIBLE(studentId);
    const response = await axios.get(endpoint);
    const data = Array.isArray(response.data) ? response.data : [];
    
    return data.map((election: any) => ({
      ...election,
      id: election._id || election.id,
      startDate: election.start_time || election.startDate,
      endDate: election.end_time || election.endDate,
      facultyId: election.faculty_id || election.facultyId,
      faculty: election.faculty_id || election.faculty,
    }));
  }

  async getElectionById(id: string): Promise<Election> {
    const response = await axios.get(`${API_ENDPOINTS.ELECTIONS.BASE}/${id}`);
    const election = response.data;
    
    const faculty = election.faculty_id;
    const facultyId = typeof faculty === 'object' && faculty?._id 
      ? faculty._id.toString() 
      : (typeof faculty === 'string' ? faculty : election.facultyId);
    
    return {
      ...election,
      id: election._id || election.id,
      startDate: election.start_time || election.startDate,
      endDate: election.end_time || election.endDate,
      facultyId: facultyId,
      faculty: typeof faculty === 'object' ? faculty : (election.faculty || null),
    };
  }

  async createElection(electionData: CreateElectionData): Promise<Election> {
    const backendData: any = {
      title: electionData.title,
      type: electionData.type,
      start_time: electionData.startDate,
      end_time: electionData.endDate,
    };
    if (electionData.description) backendData.description = electionData.description;
    if (electionData.facultyId) backendData.faculty_id = electionData.facultyId;
    
    const response = await axios.post(API_ENDPOINTS.ELECTIONS.CREATE, backendData);
    const election = response.data.election || response.data;
    
    return {
      ...election,
      id: election._id || election.id,
      startDate: election.start_time || election.startDate,
      endDate: election.end_time || election.endDate,
      facultyId: election.faculty_id || election.facultyId,
    };
  }

  async updateElection(id: string, electionData: UpdateElectionData): Promise<Election> {
    const backendData: any = {};
    if (electionData.title) backendData.title = electionData.title;
    if (electionData.description !== undefined) backendData.description = electionData.description;
    if (electionData.type) backendData.type = electionData.type;
    if (electionData.status) backendData.status = electionData.status;
    if (electionData.startDate) backendData.start_time = electionData.startDate;
    if (electionData.endDate) backendData.end_time = electionData.endDate;
    if (electionData.facultyId) backendData.faculty_id = electionData.facultyId;
    
    const response = await axios.put(`${API_ENDPOINTS.ELECTIONS.BASE}/${id}`, backendData);
    const election = response.data.updated || response.data;
    
    return {
      ...election,
      id: election._id || election.id,
      startDate: election.start_time || election.startDate,
      endDate: election.end_time || election.endDate,
      facultyId: election.faculty_id || election.facultyId,
    };
  }

  async deleteElection(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.ELECTIONS.BASE}/${id}`);
  }

  async startElection(id: string): Promise<Election> {
    const response = await axios.put(`${API_ENDPOINTS.ELECTIONS.BASE}/${id}/start`);
    return response.data;
  }

  async endElection(id: string): Promise<Election> {
    const response = await axios.put(`${API_ENDPOINTS.ELECTIONS.BASE}/${id}/end`);
    return response.data;
  }

  async cancelElection(id: string): Promise<Election> {
    const response = await axios.put(`${API_ENDPOINTS.ELECTIONS.BASE}/${id}/cancel`);
    return response.data;
  }
}

export default new ElectionService();
