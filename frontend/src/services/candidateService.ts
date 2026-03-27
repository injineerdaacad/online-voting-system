import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  manifesto?: string;
  image?: string;
  election: {
    id: string;
    title: string;
    type: string;
  };
  faculty?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  votes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateData {
  name: string;
  email: string;
  position: string;
  manifesto?: string;
  image?: string;
  electionId: string;
  facultyId?: string;
  departmentId?: string;
}

export interface UpdateCandidateData {
  name?: string;
  email?: string;
  position?: string;
  manifesto?: string;
  image?: string;
  facultyId?: string;
  departmentId?: string;
}

export interface CandidateFilters {
  electionId?: string;
  position?: string;
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

class CandidateService {
  async getCandidates(filters: CandidateFilters = {}): Promise<PaginatedResponse<Candidate>> {
    const response = await axios.get(API_ENDPOINTS.CANDIDATES.BASE, { params: filters });
    
    const data = Array.isArray(response.data) ? response.data : [];
    
    const normalizedData = data.map((candidate: any) => ({
      ...candidate,
      _id: candidate._id || candidate.id || candidate.candidate_id,
      id: candidate.id || candidate._id || candidate.candidate_id,
    }));
    
    return {
      data: normalizedData,
      total: normalizedData.length,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(normalizedData.length / (filters.limit || 10)),
    };
  }

  async getCandidatesByElection(electionId: string): Promise<Candidate[]> {
    const response = await axios.get(`${API_ENDPOINTS.CANDIDATES.BY_ELECTION}/${electionId}`);
    return response.data;
  }

  async getCandidateById(id: string): Promise<Candidate> {
    const response = await axios.get(`${API_ENDPOINTS.CANDIDATES.BASE}/${id}`);
    return response.data;
  }

  async createCandidate(candidateData: CreateCandidateData): Promise<Candidate> {
    const response = await axios.post(API_ENDPOINTS.CANDIDATES.ADD, candidateData);
    return response.data;
  }

  async updateCandidate(id: string, candidateData: UpdateCandidateData): Promise<Candidate> {
    const response = await axios.put(`${API_ENDPOINTS.CANDIDATES.BASE}/${id}`, candidateData);
    return response.data;
  }

  async deleteCandidate(id: string): Promise<void> {
    await axios.delete(`${API_ENDPOINTS.CANDIDATES.BASE}/${id}`);
  }
}

export default new CandidateService();
