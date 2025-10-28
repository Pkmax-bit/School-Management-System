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

  const response = await fetch(url, requestOptions);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return await response.json();
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
    name: string;
    email: string;
  };
  campus?: {
    id: string;
    name: string;
    code: string;
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
}

export interface ScheduleUpdate {
  classroom_id?: string;
  subject_id?: string;
  teacher_id?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  room?: string;
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

  delete: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/schedules/${id}`, { method: 'DELETE' }),
};

export default schedulesApi;
