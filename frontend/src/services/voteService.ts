import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export interface Vote {
  id: string;
  candidateId: string;
  electionId: string;
  voterId: string;
  createdAt: string;
}

export interface VoteData {
  candidateId: string;
  electionId: string;
}

export interface VoteFilters {
  electionId?: string;
  candidateId?: string;
  voterId?: string;
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

class VoteService {
  async getVotes(filters: VoteFilters = {}): Promise<PaginatedResponse<Vote>> {
    const response = await axios.get((API_ENDPOINTS.VOTES as any).BASE, { params: filters });
    return response.data;
  }

  async voteForCandidate(voteData: VoteData): Promise<Vote> {
    const response = await axios.post((API_ENDPOINTS.VOTES as any).BASE, voteData);
    return response.data;
  }

  async hasVotedInElection(electionId: string): Promise<boolean> {
    const response = await axios.get(`${(API_ENDPOINTS.VOTES as any).BASE}/check/${electionId}`);
    return response.data.hasVoted;
  }

  async getUserVoteForElection(electionId: string): Promise<Vote | null> {
    const response = await axios.get(`${(API_ENDPOINTS.VOTES as any).BASE}/user/${electionId}`);
    return response.data.vote;
  }

  async getVoteById(id: string): Promise<Vote> {
    const response = await axios.get(`${(API_ENDPOINTS.VOTES as any).BASE}/${id}`);
    return response.data;
  }

  async deleteVote(id: string): Promise<void> {
    await axios.delete(`${(API_ENDPOINTS.VOTES as any).BASE}/${id}`);
  }
}

export default new VoteService();
