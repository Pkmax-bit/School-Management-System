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
