export interface User {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  full_name?: string;
  student_id?: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  faculty?: string;
  is_login?: boolean;
  createdAt?: string;
  updatedAt?: string;
  last_login?: string;
  last_logout?: string;
  attempt_login_time?: string;
  attempt_login?: number;
  login_attempts?: number;
  is_locked?: boolean;
  account_locked?: boolean;
  last_seen?: string;
  faculty_id?: {
    _id: string;
    name: string;
    code?: string;
  } | null;
  department?: {
    _id: string;
    name: string;
    code?: string;
  } | null;
  batch?: string;
  graduation_year?: number;
  has_voted?: Array<{
    election_id: {
      _id: string;
      title: string;
    };
    voted_at: string;
  }>;
  created_by?: {
    _id: string;
    username?: string;
    email?: string;
  };
  updated_by?: {
    _id: string;
    username?: string;
    email?: string;
  };
  photo?: string;
  photo_url?: string;
  photo_id?: string;
}

export interface CreateUserData {
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  confirm_password: string;
  role: string;
  faculty_id?: string;
  department?: string;
  batch?: string;
  graduation_year?: number;
}

export interface UpdateUserData {
  name?: string;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  faculty_id?: string;
  department?: string;
  batch?: string;
  graduation_year?: number;
  status?: string;
}

