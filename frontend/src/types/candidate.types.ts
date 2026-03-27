export interface Candidate {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  position: string;
  manifesto?: string;
  image?: string;
  student?: {
    _id?: string;
    id?: string;
    name?: string;
    student_id?: string;
  };
  election: {
    _id?: string;
    id?: string;
    title: string;
    status?: string;
    type?: string;
    faculty_id?: {
      _id: string;
      name: string;
    };
  };
  faculty?: {
    _id?: string;
    id?: string;
    name: string;
  };
  department?: {
    _id?: string;
    id?: string;
    name: string;
  };
  votes?: number;
  createdAt?: string;
  updatedAt?: string;
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

