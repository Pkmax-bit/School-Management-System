import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (jwtToken) {
    headers.Authorization = `Bearer ${jwtToken}`;
  } else if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const requestOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  try {
    const response = await fetch(url, requestOptions);
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
