/**
 * Subjects API - Backend Integration
 * CRUD operations cho subjects table
 */

import api from './api';

// Kiểm tra authentication
const checkAuth = async () => {
  // Development mode: bypass authentication for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('Development mode: Bypassing authentication for testing');
    return { user: { id: 'dev-user', role: 'admin' } };
  }
  
  // Check if user is authenticated via backend
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication required. Please login first.');
  }
  return { user: { id: 'user', role: 'admin' } };
};

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSubjectData {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSubjectData {
  name?: string;
  code?: string;
  description?: string;
}

export class SubjectsAPI {
  /**
   * Lấy tất cả subjects
   */
  static async getAll(): Promise<Subject[]> {
    try {
      await checkAuth();
      
      const response = await api.get('api/subjects/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('SubjectsAPI.getAll error:', error);
      throw error;
    }
  }

  /**
   * Lấy subject theo ID
   */
  static async getById(id: string): Promise<Subject | null> {
    try {
      await checkAuth();
      
      const response = await api.get(`/api/subjects/${id}`);
      return response.data as Subject | null;
    } catch (error) {
      console.error('SubjectsAPI.getById error:', error);
      throw error;
    }
  }

  /**
   * Tạo subject mới
   */
  static async create(data: CreateSubjectData): Promise<Subject> {
    try {
      await checkAuth();
      
      const response = await api.post('api/subjects/', data);
      return response.data as Subject;
    } catch (error) {
      console.error('SubjectsAPI.create error:', error);
      throw error;
    }
  }

  /**
   * Cập nhật subject
   */
  static async update(id: string, data: UpdateSubjectData): Promise<Subject> {
    try {
      await checkAuth();
      
      const response = await api.put(`/api/subjects/${id}`, data);
      return response.data as Subject;
    } catch (error) {
      console.error('SubjectsAPI.update error:', error);
      throw error;
    }
  }

  /**
   * Xóa subject
   */
  static async delete(id: string): Promise<void> {
    try {
      await checkAuth();
      
      await api.delete(`/api/subjects/${id}`);
    } catch (error) {
      console.error('SubjectsAPI.delete error:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm subjects
   */
  static async search(query: string): Promise<Subject[]> {
    try {
      await checkAuth();
      
      const response = await api.get(`/api/subjects/search/${query}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('SubjectsAPI.search error:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra code có tồn tại không
   */
  static async checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    try {
      await checkAuth();
      
      // Get all subjects and check code existence
      const response = await api.get('api/subjects/');
      const subjects = Array.isArray(response.data) ? response.data : [];
      
      return subjects.some((subject: Subject) => 
        subject.code === code && subject.id !== excludeId
      );
    } catch (error) {
      console.error('SubjectsAPI.checkCodeExists error:', error);
      throw error;
    }
  }
}

export default SubjectsAPI;
