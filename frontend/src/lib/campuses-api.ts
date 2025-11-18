import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  // Try multiple token sources (like Phuc Dat pattern)
  const jwtToken = typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token') || 
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    : null;
  
  // Try to get Supabase session token
  let session = null;
  try {
    const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();
    session = supabaseSession;
    if (sessionError) {
      console.warn('Campuses API - Supabase session error:', sessionError);
    }
  } catch (supabaseError) {
    console.warn('Campuses API - Failed to get Supabase session:', supabaseError);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Priority: JWT token first, then Supabase token
  if (jwtToken && jwtToken.trim() !== '') {
    headers.Authorization = `Bearer ${jwtToken.trim()}`;
    console.log('Campuses API - Using JWT token for authentication');
  } else if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
    console.log('Campuses API - Using Supabase OAuth2 token for authentication');
  } else {
    console.warn('Campuses API - No authentication token found - request may fail');
  }

  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Campuses API Request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url,
        method: options.method || 'GET',
        hasAuthHeader: !!headers.Authorization
      });
      
      // Handle 401 Unauthorized - but don't clear token immediately (might be temporary)
      if (response.status === 401) {
        console.warn('Campuses API - 401 Unauthorized. Token may be expired or invalid.');
        // Don't clear token here - let useApiAuth handle it
        throw new Error(`HTTP 401: ${errorText || 'Could not validate credentials'}`);
      } else if (response.status === 500) {
        throw new Error(`Server Error: Backend đang gặp lỗi. Vui lòng thử lại sau.`);
      } else if (response.status === 403) {
        throw new Error(`Authentication Error: Bạn không có quyền thực hiện thao tác này.`);
      } else if (response.status === 404) {
        throw new Error(`Not Found: API endpoint không tồn tại.`);
      } else {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('Campuses API Request failed:', error);
    throw error;
  }
}

export interface Campus {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampusCreate {
  code: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface CampusUpdate {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
}

export const campusesApi = {
  list: (q?: string) =>
    apiRequest(`${API_BASE_URL}/api/campuses${q ? `?q=${encodeURIComponent(q)}` : ''}`, { method: 'GET' }),

  get: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/campuses/${id}`, { method: 'GET' }),

  create: (data: CampusCreate) =>
    apiRequest(`${API_BASE_URL}/api/campuses/`, { method: 'POST', body: data }),

  update: (id: string, data: CampusUpdate) =>
    apiRequest(`${API_BASE_URL}/api/campuses/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/campuses/${id}`, { method: 'DELETE' }),
};

export default campusesApi;
