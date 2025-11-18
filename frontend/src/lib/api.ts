/**
 * API Configuration
 * Cấu hình API cho hệ thống quản lý trường học
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/';

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    // Check multiple possible token keys
    const token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('access_token') ||
                  localStorage.getItem('token');
    
    if (token && token.trim() !== '' && config.headers) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all possible token keys
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      console.warn('Access forbidden - user may not have permission');
    }
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (userData: any) =>
    api.post('/api/auth/register', userData),
  getCurrentUser: () =>
    api.get('/api/auth/me'),
};

export const usersAPI = {
  getUsers: (params?: any) =>
    api.get('/api/users', { params }),
  getUser: (id: string) =>
    api.get(`/api/users/${id}`),
  updateUser: (id: string, data: any) =>
    api.put(`/api/users/${id}`, data),
  deleteUser: (id: string) =>
    api.delete(`/api/users/${id}`),
};

export const teachersAPI = {
  getTeachers: (params?: any) =>
    api.get('/api/teachers', { params }),
  getTeacher: (id: string) =>
    api.get(`/api/teachers/${id}`),
  createTeacher: (data: any) =>
    api.post('/api/teachers', data),
  updateTeacher: (id: string, data: any) =>
    api.put(`/api/teachers/${id}`, data),
  deleteTeacher: (id: string) =>
    api.delete(`/api/teachers/${id}`),
};

export const studentsAPI = {
  getStudents: (params?: any) =>
    api.get('/api/students', { params }),
  getStudent: (id: string) =>
    api.get(`/api/students/${id}`),
  createStudent: (data: any) =>
    api.post('/api/students', data),
  updateStudent: (id: string, data: any) =>
    api.put(`/api/students/${id}`, data),
  deleteStudent: (id: string) =>
    api.delete(`/api/students/${id}`),
};

export const subjectsAPI = {
  getSubjects: (params?: any) =>
    api.get('/api/subjects', { params }),
  getSubject: (id: string) =>
    api.get(`/api/subjects/${id}`),
  createSubject: (data: any) =>
    api.post('/api/subjects', data),
  updateSubject: (id: string, data: any) =>
    api.put(`/api/subjects/${id}`, data),
  deleteSubject: (id: string) =>
    api.delete(`/api/subjects/${id}`),
};

// Classrooms API removed

export const schedulesAPI = {
  getSchedules: (params?: any) =>
    api.get('/api/schedules', { params }),
  getSchedule: (id: string) =>
    api.get(`/api/schedules/${id}`),
  createSchedule: (data: any) =>
    api.post('/api/schedules', data),
  updateSchedule: (id: string, data: any) =>
    api.put(`/api/schedules/${id}`, data),
  deleteSchedule: (id: string) =>
    api.delete(`/api/schedules/${id}`),
};

export const assignmentsAPI = {
  getAssignments: (params?: any) =>
    api.get('/api/assignments', { params }),
  getAssignment: (id: string) =>
    api.get(`/api/assignments/${id}`),
  createAssignment: (data: any) =>
    api.post('/api/assignments', data),
  addQuestion: (assignmentId: string, data: any) =>
    api.post(`/api/assignments/${assignmentId}/questions`, data),
  submitAssignment: (data: any) =>
    api.post('/api/assignments/submit', data),
  getSubmissions: (assignmentId: string) =>
    api.get(`/api/assignments/${assignmentId}/submissions`),
};

export const attendancesAPI = {
  getAttendances: (params?: any) =>
    api.get('/api/attendances', { params }),
  getAttendance: (id: string) =>
    api.get(`/api/attendances/${id}`),
  createAttendance: (data: any) =>
    api.post('/api/attendances', data),
  updateAttendance: (id: string, data: any) =>
    api.put(`/api/attendances/${id}`, data),
  deleteAttendance: (id: string) =>
    api.delete(`/api/attendances/${id}`),
};

export const financesAPI = {
  getFinances: (params?: any) =>
    api.get('/api/finances', { params }),
  getFinance: (id: string) =>
    api.get(`/api/finances/${id}`),
  createFinance: (data: any) =>
    api.post('/api/finances', data),
  updateFinance: (id: string, data: any) =>
    api.put(`/api/finances/${id}`, data),
  deleteFinance: (id: string) =>
    api.delete(`/api/finances/${id}`),
  getFinanceSummary: () =>
    api.get('/api/finances/stats/summary'),
};
