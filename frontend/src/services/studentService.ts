import axios from '../utils/axios';
import { API_ENDPOINTS } from '../utils/constants';

export class StudentService {
  static async getStudents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    faculty_id?: string;
    department_id?: string;
    status?: string;
  }) {
    const response = await axios.get(API_ENDPOINTS.USERS.BASE, { 
      params: { ...params, role: 'Student' }
    });
    return response.data;
  }

  static async getStudentById(id: string) {
    const response = await axios.get(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.data;
  }

  static async createStudent(studentData: {
    student_id: string;
    full_name: string;
    email: string;
    phone: string;
    password: string;
    faculty_id: string;
    department_id: string;
    year_of_study: number;
    status?: string;
  }) {
    const response = await axios.post(API_ENDPOINTS.USERS.BASE, {
      ...studentData,
      role: 'Student'
    });
    return response.data;
  }

  static async updateStudent(id: string, studentData: {
    full_name?: string;
    email?: string;
    phone?: string;
    faculty_id?: string;
    department_id?: string;
    year_of_study?: number;
    status?: string;
  }) {
    const response = await axios.put(`${API_ENDPOINTS.USERS.BASE}/${id}`, studentData);
    return response.data;
  }

  static async deleteStudent(id: string) {
    const response = await axios.delete(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.data;
  }

  static async lockStudent(id: string) {
    const response = await axios.patch(`${API_ENDPOINTS.USERS.BASE}/${id}/lock`);
    return response.data;
  }

  static async unlockStudent(id: string) {
    const response = await axios.patch(`${API_ENDPOINTS.USERS.BASE}/${id}/unlock`);
    return response.data;
  }

  static async resetPassword(id: string, newPassword: string) {
    const response = await axios.patch(API_ENDPOINTS.USERS.RESET_PASSWORD(id), {
      password: newPassword
    });
    return response.data;
  }
}

export default StudentService;
