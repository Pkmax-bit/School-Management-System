import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}, retryCount = 0): Promise<any> {
  const maxRetries = 1; // Retry once if 401
  
  // Try to get JWT token from localStorage (check multiple possible keys)
  let jwtToken = typeof window !== 'undefined' 
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
      console.warn('Schedules API - Supabase session error:', sessionError);
    }
  } catch (supabaseError) {
    console.warn('Schedules API - Failed to get Supabase session:', supabaseError);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Priority: JWT token first, then Supabase token
  if (jwtToken && jwtToken.trim() !== '') {
    headers.Authorization = `Bearer ${jwtToken.trim()}`;
  } else if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
    // Update localStorage with Supabase token for consistency
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', session.access_token);
      localStorage.setItem('access_token', session.access_token);
    }
  }

  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const response = await fetch(url, requestOptions);
    
    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401 && retryCount < maxRetries) {
      console.warn(`Schedules API - 401 Unauthorized (attempt ${retryCount + 1}/${maxRetries + 1}), trying to refresh token...`);
      
      // Try to refresh from Supabase
      try {
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.getSession();
        if (newSession?.access_token && newSession.access_token !== jwtToken) {
          // Update token and retry
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', newSession.access_token);
            localStorage.setItem('access_token', newSession.access_token);
          }
          // Retry with new token
          return apiRequest(url, options, retryCount + 1);
        }
      } catch (refreshError) {
        console.warn('Schedules API - Token refresh failed:', refreshError);
      }
      
      // If refresh failed, throw error
      const errorText = await response.text();
      let errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      try {
        const json = JSON.parse(errorText);
        errorMessage = json.detail || json.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }
    
    if (!response.ok) {
      const text = await response.text();
      // For 404 errors, return a more descriptive error
      if (response.status === 404) {
        let errorMessage = 'Not found';
        try {
          const json = JSON.parse(text);
          errorMessage = json.detail || json.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      // For 500 errors, try to parse error detail
      if (response.status === 500) {
        let errorMessage = 'Internal server error';
        try {
          const json = JSON.parse(text);
          errorMessage = json.detail || json.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      // For 403 errors
      if (response.status === 403) {
        let errorMessage = 'Không có quyền truy cập';
        try {
          const json = JSON.parse(text);
          errorMessage = json.detail || json.message || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return await response.json();
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy.');
    }
    throw error;
  }
}

export interface Schedule {
  id: string;
  classroom_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number; // 0-6 (Monday-Sunday)
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  room?: string;
  room_id?: string;
  campus_id?: string;
  date?: string; // Ngày cụ thể (YYYY-MM-DD format)
  created_at?: string;
  updated_at?: string;
  // Joined data
  classroom?: {
    id: string;
    name: string;
    code: string;
    campus_id?: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
  teacher?: {
    id: string;
    user_id?: string;
    teacher_code?: string;
    display_name?: string;
    email?: string;
    user?: {
      id?: string;
      full_name?: string;
      email?: string;
    };
  };
  campus?: {
    id: string;
    name: string;
    code: string;
  };
  room_detail?: {
    id: string;
    name?: string;
    code?: string;
    capacity?: number;
    campus_id?: string;
  };
}

export interface ScheduleCreate {
  classroom_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  room_id?: string;
  campus_id?: string;
  date?: string; // Ngày cụ thể (YYYY-MM-DD format)
}

export interface ScheduleUpdate {
  classroom_id?: string;
  subject_id?: string;
  teacher_id?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  room?: string;
  room_id?: string;
  campus_id?: string;
  date?: string; // Ngày cụ thể (YYYY-MM-DD format)
}

export const schedulesApi = {
  list: (params?: { 
    skip?: number; 
    limit?: number; 
    classroom_id?: string; 
    teacher_id?: string;
    campus_id?: string;
    day_of_week?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.classroom_id) queryParams.append('classroom_id', params.classroom_id);
    if (params?.teacher_id) queryParams.append('teacher_id', params.teacher_id);
    if (params?.campus_id) queryParams.append('campus_id', params.campus_id);
    if (params?.day_of_week !== undefined) queryParams.append('day_of_week', params.day_of_week.toString());
    
    const url = `${API_BASE_URL}/api/schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiRequest(url, { method: 'GET' });
  },

  get: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/schedules/${id}`, { method: 'GET' }),

  create: (data: ScheduleCreate) =>
    apiRequest(`${API_BASE_URL}/api/schedules/`, { method: 'POST', body: data }),

  update: (id: string, data: ScheduleUpdate) =>
    apiRequest(`${API_BASE_URL}/api/schedules/${id}`, { method: 'PUT', body: data }),

  delete: async (id: string) => {
    try {
      return await apiRequest(`${API_BASE_URL}/api/schedules/${id}`, { method: 'DELETE' });
    } catch (error: any) {
      // For 404 errors, don't throw - schedule might already be deleted
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        return { deleted: false, notFound: true };
      }
      throw error;
    }
  },
};

export default schedulesApi;
