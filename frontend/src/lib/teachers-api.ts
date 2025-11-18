/**
 * Teachers API - Following Subjects Pattern
 * Complete CRUD operations for teachers management
 */

import { supabase } from './supabase';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Make an authenticated API request
 */
async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  try {
    // Try to get JWT token from localStorage first
    const jwtToken = localStorage.getItem('auth_token');
    
    // Try to get Supabase session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Teachers API Request Debug:', {
      url,
      method: options.method || 'GET',
      hasJwtToken: !!jwtToken,
      hasSupabaseSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionError
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Priority: JWT token first, then Supabase token
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
      console.log('🔍 Using JWT token for authentication');
    } else if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      console.log('🔍 Using Supabase OAuth2 token for authentication');
    } else {
      console.warn('🔍 No authentication token found');
    }

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    };

    console.log('Making request to:', url, requestOptions);
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      let errorMessage = `Request failed with status ${response.status}`;
      
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } catch {
        // If can't parse, use error text as message
        if (errorText && errorText.trim()) {
          errorMessage = errorText;
        }
      }
      
      if (response.status === 401) {
        errorMessage = errorMessage || 'Authentication required. Please login first.';
      } else if (response.status === 403) {
        errorMessage = errorMessage || 'Access forbidden. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        errorMessage = errorMessage || 'Resource not found.';
      } else if (response.status === 400) {
        errorMessage = errorMessage || 'Invalid request. Please check your input data.';
      } else if (response.status === 500) {
        errorMessage = errorMessage || 'Server Error. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Helper functions for API calls
async function apiGet(url: string, params?: Record<string, string>): Promise<any> {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiRequest(`${url}${queryString}`);
}

async function apiPost(url: string, data: any): Promise<any> {
  return apiRequest(url, { method: 'POST', body: data });
}

async function apiPut(url: string, data: any): Promise<any> {
  return apiRequest(url, { method: 'PUT', body: data });
}

async function apiDelete(url: string): Promise<any> {
  return apiRequest(url, { method: 'DELETE' });
}

// Teacher interfaces
export interface Teacher {
  id: string;
  user_id: string;
  teacher_code: string;
  phone?: string;
  address?: string;
  specialization?: string;
  experience_years?: string;
  education_level?: string;
  degree_name?: string;
  created_at: string;
  updated_at?: string;
  // User info (from users table)
  name?: string;
  email?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
}

export interface CreateTeacherData {
  name: string;
  email: string;
  password?: string;  // Optional password, default to '123456' if not provided
  phone?: string;
  address?: string;
  role: string;
  education_level?: string;
  degree_name?: string;
}

export interface UpdateTeacherData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
  education_level?: string;
  degree_name?: string;
}

// Teachers API
export const teachersApi = {
  // Get all teachers
  getTeachers: async (params?: { search?: string }): Promise<Teacher[]> => {
    try {
      console.log('Fetching teachers with real API');
      const response = await apiGet(`${API_BASE_URL}/api/teachers/`, params);
      console.log('✅ Teachers fetched via API:', response);
      
      // Backend returns data directly, not wrapped in response.data
      if (Array.isArray(response)) {
        return response;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('Unexpected response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  // Get teacher by ID
  getTeacherById: async (id: string): Promise<Teacher | null> => {
    try {
      const response = await apiGet(`${API_BASE_URL}/api/teachers/${id}`);
      return response.data as Teacher | null;
    } catch (error) {
      console.error(`Error fetching teacher with id ${id}:`, error);
      throw error;
    }
  },

  // Create teacher
  createTeacher: async (data: CreateTeacherData): Promise<Teacher> => {
    try {
      console.log('Creating teacher with real API:', data);
      const response = await apiPost(`${API_BASE_URL}/api/teachers/`, data);
      console.log('✅ Teacher created via API:', response);
      
      // Backend returns TeacherResponse directly, not wrapped in data
      if (response && typeof response === 'object') {
        if (response.data) {
          return response.data as Teacher;
        } else {
          // Response is already the teacher object
          return response as Teacher;
        }
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Create teacher failed:', error);
      throw error;
    }
  },

  // Update teacher
  updateTeacher: async (id: string, data: UpdateTeacherData): Promise<Teacher> => {
    try {
      console.log('Updating teacher with real API:', id, data);
      console.log('API URL:', `${API_BASE_URL}/api/teachers/${id}`);
      console.log('Update data:', data);
      
      const response = await apiPut(`${API_BASE_URL}/api/teachers/${id}`, data);
      console.log('✅ Teacher updated via API:', response);
      
      // Handle response format
      if (response && typeof response === 'object') {
        return response as Teacher;
      } else if (response && response.data) {
        return response.data as Teacher;
      } else {
        console.warn('Unexpected response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Update teacher ${id} failed:`, error);
      throw error;
    }
  },

  // Delete teacher
  deleteTeacher: async (id: string): Promise<void> => {
    try {
      console.log('Deleting teacher with real API:', id);
      await apiDelete(`${API_BASE_URL}/api/teachers/${id}`);
      console.log('✅ Teacher deleted via API:', id);
    } catch (error) {
      console.error(`Delete teacher ${id} failed:`, error);
      throw error;
    }
  },

  // Check if teacher code exists
  checkCodeExists: async (code: string, excludeId?: string): Promise<boolean> => {
    try {
      const response = await apiGet(`${API_BASE_URL}/api/teachers/check-code/${code}${excludeId ? `?exclude_id=${excludeId}` : ''}`);
      return response.data as boolean;
    } catch (error) {
      console.error(`Error checking code existence for ${code}:`, error);
      
      // Fallback: Return false for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock check for code:', code);
        return false;
      }
      throw error;
    }
  },

  // Get teacher statistics
  getTeacherStats: async (): Promise<any> => {
    try {
      console.log('Fetching teacher stats with real API');
      const response = await apiGet(`${API_BASE_URL}/api/teachers/stats/overview`);
      console.log('✅ Teacher stats fetched via API:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      throw error;
    }
  }
};
