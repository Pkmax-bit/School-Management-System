/**
 * Subjects API - Based on Phuc Dat Employee API Pattern
 * CRUD operations cho subjects table using Supabase OAuth2
 */

import { supabase } from './supabase';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Make an authenticated API request using Supabase session tokens
 */
async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Subjects API Request Debug:', {
      url,
      method: options.method || 'GET',
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionError
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      console.log('🔍 Added OAuth2 authorization header with session token:', session.access_token.substring(0, 20) + '...');
    } else {
      console.warn('🔍 No OAuth2 session token found');
    }

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Subjects API Request failed:', error);
    throw error;
  }
}

/**
 * GET request
 */
async function apiGet(url: string, headers?: Record<string, string>): Promise<any> {
  return apiRequest(url, { method: 'GET', headers });
}

/**
 * POST request
 */
async function apiPost(url: string, body: unknown, headers?: Record<string, string>): Promise<any> {
  return apiRequest(url, { method: 'POST', body, headers });
}

/**
 * PUT request
 */
async function apiPut(url: string, body: unknown, headers?: Record<string, string>): Promise<any> {
  return apiRequest(url, { method: 'PUT', body, headers });
}

/**
 * DELETE request
 */
function apiDelete(url: string, headers?: Record<string, string>) {
  return apiRequest(url, { method: 'DELETE', headers });
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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

// Subjects API functions - Based on Phuc Dat Employee API pattern
export const subjectsApi = {
  // Get all subjects with authentication
  getSubjects: (params?: {
    skip?: number
    limit?: number
    search?: string
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/api/subjects/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return apiGet(url);
  },

  // Get subjects with simple auth (fallback)
  getSubjectsSimple: () => {
    return apiGet(`${API_BASE_URL}/api/subjects/simple`);
  },

  // Get subjects public (no auth)
  getSubjectsPublic: () => {
    return apiGet(`${API_BASE_URL}/api/subjects/public-list`);
  },

  // Get subject by ID
  getSubject: (id: string) => {
    return apiGet(`${API_BASE_URL}/api/subjects/${id}`);
  },

  // Create subject
  createSubject: (data: CreateSubjectData) => {
    return apiPost(`${API_BASE_URL}/api/subjects/`, data);
  },

  // Update subject
  updateSubject: (id: string, data: UpdateSubjectData) => {
    return apiPut(`${API_BASE_URL}/api/subjects/${id}`, data);
  },

  // Delete subject
  deleteSubject: (id: string) => {
    return apiDelete(`${API_BASE_URL}/api/subjects/${id}`);
  },

  // Search subjects
  searchSubjects: (query: string) => {
    return apiGet(`${API_BASE_URL}/api/subjects/search/${encodeURIComponent(query)}`);
  },

  // Check if code exists
  checkCodeExists: async (code: string, excludeId?: string) => {
    try {
      const subjects = await subjectsApi.getSubjects();
      return subjects.some((subject: Subject) => 
        subject.code === code && subject.id !== excludeId
      );
    } catch (error) {
      console.error('Error checking code existence:', error);
      return false;
    }
  },

  // Get subject statistics
  getSubjectStats: () => {
    return apiGet(`${API_BASE_URL}/api/subjects/stats/overview`);
  },

  // Test endpoints
  testSubjects: () => {
    return apiGet(`${API_BASE_URL}/api/subjects/test`);
  },

  testSubjectsSimple: () => {
    return apiGet(`${API_BASE_URL}/api/subjects/simple-test`);
  },

  // Create sample data
  createSampleSubjects: () => {
    return apiPost(`${API_BASE_URL}/api/subjects/create-sample`, {});
  }
};

export default subjectsApi;
