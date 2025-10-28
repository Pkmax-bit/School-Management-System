/**
 * Classrooms API - Hybrid Authentication with Debug Logs
 * Uses JWT token (backend auth) or Supabase OAuth2 token, whichever is available
 */

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
      if (response.status === 401) throw new Error('Authentication required (401)');
      if (response.status === 403) throw new Error('Forbidden (403)');
      if (response.status === 404) throw new Error('Not Found (404)');
      if (response.status === 500) throw new Error('Server Error (500)');
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo backend server đang chạy.');
    }
    throw error;
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) q.append(k, String(v));
  });
  return `${API_BASE_URL}${path}${q.toString() ? `?${q.toString()}` : ''}`;
}

export interface ClassroomPayload {
  name: string
  code: string
  description?: string | null
  capacity?: number
  teacher_id?: string | null
  subject_id?: string | null
  campus_id?: string | null
  student_ids?: string[]
  open_date?: string | null
  close_date?: string | null
}

export const classroomsHybridApi = {
  list: (params?: { skip?: number; limit?: number; teacher_id?: string; campus_id?: string }) =>
    apiRequest(buildUrl('/api/classrooms/', params), { method: 'GET' }),

  get: (id: string) => apiRequest(`${API_BASE_URL}/api/classrooms/${id}`, { method: 'GET' }),

  create: (data: ClassroomPayload) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/`, { method: 'POST', body: data }),

  update: (id: string, data: Partial<ClassroomPayload>) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/${id}`, { method: 'PUT', body: data }),

  remove: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/${id}`, { method: 'DELETE' }),

  // Add students into an existing classroom
  addStudents: (id: string, studentIds: string[]) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/${id}/students`, { method: 'POST', body: { student_ids: studentIds } }),

  // Get next class code
  getNextCode: () =>
    apiRequest(`${API_BASE_URL}/api/classrooms/next-code`, { method: 'GET' }),
};

export default classroomsHybridApi;


