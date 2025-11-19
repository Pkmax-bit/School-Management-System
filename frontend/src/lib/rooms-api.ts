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
      console.warn('Rooms API - Supabase session error:', sessionError);
    }
  } catch (supabaseError) {
    console.warn('Rooms API - Failed to get Supabase session:', supabaseError);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Priority: JWT token first, then Supabase token
  if (jwtToken && jwtToken.trim() !== '') {
    headers.Authorization = `Bearer ${jwtToken.trim()}`;
    console.log('Rooms API - Using JWT token for authentication');
  } else if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
    console.log('Rooms API - Using Supabase OAuth2 token for authentication');
  } else {
    console.warn('Rooms API - No authentication token found - request may fail');
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
      console.error('Rooms API Request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url,
        method: options.method || 'GET',
        hasAuthHeader: !!headers.Authorization
      });
      
      // Handle 401 Unauthorized - but don't clear token immediately (might be temporary)
      if (response.status === 401) {
        console.warn('Rooms API - 401 Unauthorized. Token may be expired or invalid.');
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
    console.error('Rooms API Request failed:', error);
    throw error;
  }
}

export interface Room {
  id: string;
  campus_id: string;
  name: string;
  code: string;
  capacity?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
  campus?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface RoomCreate {
  campus_id: string;
  name: string;
  code: string;
  capacity?: number;
  description?: string;
}

export interface RoomUpdate {
  name?: string;
  code?: string;
  capacity?: number;
  description?: string;
}

export const roomsApi = {
  list: (campus_id?: string) => {
    const params = campus_id ? `?campus_id=${encodeURIComponent(campus_id)}` : '';
    return apiRequest(`${API_BASE_URL}/api/rooms${params}`, { method: 'GET' });
  },

  get: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/rooms/${id}`, { method: 'GET' }),

  create: (data: RoomCreate) =>
    apiRequest(`${API_BASE_URL}/api/rooms/`, { method: 'POST', body: data }),

  update: (id: string, data: RoomUpdate) =>
    apiRequest(`${API_BASE_URL}/api/rooms/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/rooms/${id}`, { method: 'DELETE' }),
};

export default roomsApi;

