export interface Faculty {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacultyData {
  name: string;
  description?: string;
}

export interface UpdateFacultyData {
  name?: string;
  description?: string;
}

export interface FacultyFilters {
  search?: string;
  page?: number;
  limit?: number;
}

