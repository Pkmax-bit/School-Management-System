/**
 * Students API - Hybrid Authentication
 * Combines JWT and Supabase OAuth2 authentication
 */

import { createClient } from '@supabase/supabase-js';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper functions
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}

async function getSupabaseSession() {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.warn('Failed to get Supabase session:', error);
    return null;
  }
}

async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  // Get authentication tokens
  const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const session = await getSupabaseSession();

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
    
    if (response.status === 500) {
      errorMessage = 'Server Error. Please try again later.';
    } else if (response.status === 403) {
      errorMessage = 'Forbidden. You do not have permission to access this resource.';
    } else if (response.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (response.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return await response.text();
  }
}

async function apiGet(url: string, params?: Record<string, any>): Promise<any> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }
  
  const fullUrl = searchParams.toString() ? `${url}?${searchParams.toString()}` : url;
  return apiRequest(fullUrl);
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

// Student interfaces
export interface Student {
  id: string;
  user_id: string;
  student_code: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  classroom_id?: string;
  created_at: string;
  updated_at?: string;
  // User info (from users table)
  name?: string;
  email?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
}

export interface CreateStudentData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  classroom_id?: string;
}

export interface UpdateStudentData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  classroom_id?: string;
}

// Students API
export const studentsApi = {
  // Get all students
  getStudents: async (params?: { search?: string }): Promise<Student[]> => {
    try {
      console.log('Fetching students with real API');
      const response = await apiGet(`${API_BASE_URL}/api/students/`, params);
      console.log('✅ Students fetched via API:', response);
      
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
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get student by ID
  getStudentById: async (id: string): Promise<Student | null> => {
    try {
      const response = await apiGet(`${API_BASE_URL}/api/students/${id}`);
      console.log('✅ Student fetched via API:', response);
      return response as Student | null;
    } catch (error) {
      console.error(`Get student ${id} failed:`, error);
      throw error;
    }
  },

  // Create student
  createStudent: async (data: CreateStudentData): Promise<Student> => {
    try {
      console.log('Creating student with real API:', data);
      const response = await apiPost(`${API_BASE_URL}/api/students/`, data);
      console.log('✅ Student created via API:', response);
      return response as Student;
    } catch (error) {
      console.error('Create student failed:', error);
      throw error;
    }
  },

  // Update student
  updateStudent: async (id: string, data: UpdateStudentData): Promise<Student> => {
    try {
      console.log('Updating student with real API:', id, data);
      console.log('API URL:', `${API_BASE_URL}/api/students/${id}`);
      console.log('Update data:', data);
      
      const response = await apiPut(`${API_BASE_URL}/api/students/${id}`, data);
      console.log('✅ Student updated via API:', response);
      
      // Handle response format
      if (response && typeof response === 'object') {
        return response as Student;
      } else if (response && response.data) {
        return response.data as Student;
      } else {
        console.warn('Unexpected response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error(`Update student ${id} failed:`, error);
      throw error;
    }
  },

  // Delete student
  deleteStudent: async (id: string): Promise<void> => {
    try {
      console.log('Deleting student with real API:', id);
      await apiDelete(`${API_BASE_URL}/api/students/${id}`);
      console.log('✅ Student deleted via API');
    } catch (error) {
      console.error(`Delete student ${id} failed:`, error);
      throw error;
    }
  },

  // Get student stats
  getStudentStats: async (): Promise<any> => {
    try {
      console.log('Fetching student stats with real API');
      const response = await apiGet(`${API_BASE_URL}/api/students/stats/overview`);
      console.log('✅ Student stats fetched via API:', response);
      return response;
    } catch (error) {
      console.error('Error fetching student stats:', error);
      throw error;
    }
  }
};

