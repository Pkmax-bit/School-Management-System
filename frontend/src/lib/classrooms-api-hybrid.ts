/**
 * Classrooms API - Hybrid Authentication with Debug Logs
 * Uses JWT token (backend auth) or Supabase OAuth2 token, whichever is available
 * NO MOCK DATA
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  // Grab tokens
  const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  console.log('Hybrid API Request Debug (classrooms):', {
    url,
    method: options.method || 'GET',
    hasJwtToken: !!jwtToken,
    hasSupabaseSession: !!session,
    hasAccessToken: !!session?.access_token,
    sessionError
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Priority: JWT token, then Supabase token
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
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  };

  console.log('Request Options (classrooms):', requestOptions);

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Classrooms API Error:', {
      status: response.status,
      statusText: response.statusText,
      url,
      method: requestOptions.method,
      errorText,
    });

    if (response.status === 401) throw new Error('Authentication required (401)');
    if (response.status === 403) throw new Error('Forbidden (403)');
    if (response.status === 404) throw new Error('Not Found (404)');
    if (response.status === 500) throw new Error('Server Error (500)');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  console.log('Classrooms API Response:', json);
  return json;
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
}

export const classroomsHybridApi = {
  list: (params?: { skip?: number; limit?: number; teacher_id?: string }) =>
    apiRequest(buildUrl('/api/classrooms/', params), { method: 'GET' }),

  get: (id: string) => apiRequest(`${API_BASE_URL}/api/classrooms/${id}`, { method: 'GET' }),

  create: (data: ClassroomPayload) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/`, { method: 'POST', body: data }),

  update: (id: string, data: Partial<ClassroomPayload>) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/${id}`, { method: 'PUT', body: data }),

  remove: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/classrooms/${id}`, { method: 'DELETE' }),
};

export default classroomsHybridApi;


