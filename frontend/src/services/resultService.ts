import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface ElectionResult {
  id: string;
  electionId: string;
  position: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  votes: number;
  percentage: number;
  rank: number;
}

export interface ElectionResults {
  election: {
    id: string;
    title: string;
    type: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  results: ElectionResult[];
  totalVotes: number;
  totalVoters: number;
  turnout: number;
}

export interface ResultFilters {
  electionId?: string;
  position?: string;
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

class ResultService {
  async getElectionResults(electionId: string): Promise<ElectionResults> {
    const response = await axios.get(`${(API_ENDPOINTS.RESULTS as any).BASE}/${electionId}`);
    return response.data;
  }

  async getAllResults(filters: ResultFilters = {}): Promise<PaginatedResponse<ElectionResults>> {
    const response = await axios.get((API_ENDPOINTS.RESULTS as any).BASE, { params: filters });
    return response.data;
  }

  async getResultsByPosition(electionId: string, position: string): Promise<ElectionResult[]> {
    const response = await axios.get(`${(API_ENDPOINTS.RESULTS as any).BASE}/${electionId}/position/${position}`);
    return response.data;
  }

  async getWinnerByPosition(electionId: string, position: string): Promise<ElectionResult> {
    const response = await axios.get(`${(API_ENDPOINTS.RESULTS as any).BASE}/${electionId}/winner/${position}`);
    return response.data;
  }

  async exportResultsToPDF(electionId: string): Promise<Blob> {
    const response = await axios.get(`${(API_ENDPOINTS.RESULTS as any).BASE}/${electionId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportResultsToExcel(electionId: string): Promise<Blob> {
    const response = await axios.get(`${(API_ENDPOINTS.RESULTS as any).BASE}/${electionId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export default new ResultService();
