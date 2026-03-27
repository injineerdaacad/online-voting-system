export interface Department {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  description?: string;
  faculty?: {
    _id?: string;
    id?: string;
    name: string;
  };
  faculty_id?: string | {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentData {
  name: string;
  description?: string;
  facultyId: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  facultyId?: string;
}

export interface DepartmentFilters {
  facultyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

