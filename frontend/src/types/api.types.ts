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
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchResult {
  id: string;
  type: 'user' | 'election' | 'faculty' | 'candidate';
  title: string;
  description: string;
  url: string;
  metadata?: any;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

