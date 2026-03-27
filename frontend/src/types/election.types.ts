export interface Election {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  start_time?: string;
  end_time?: string;
  faculty?: {
    _id?: string;
    id?: string;
    name: string;
  };
  faculty_id?: string | {
    _id: string;
    name: string;
  };
  department?: {
    _id?: string;
    id?: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
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

