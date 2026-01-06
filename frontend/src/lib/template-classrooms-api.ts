/**
 * Template Classrooms API
 * API cho quản lý lớp học mẫu (template)
 */

import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest(url: string, options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
} = {}): Promise<any> {
  // Try multiple token sources
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
      console.warn('Template Classrooms API - Supabase session error:', sessionError);
    }
  } catch (supabaseError) {
    console.warn('Template Classrooms API - Failed to get Supabase session:', supabaseError);
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
      console.error('Template Classrooms API Request failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url,
        method: options.method || 'GET',
      });
      
      if (response.status === 401) {
        throw new Error(`HTTP 401: ${errorText || 'Could not validate credentials'}`);
      } else if (response.status === 403) {
        throw new Error('Forbidden (403)');
      } else if (response.status === 404) {
        throw new Error('Not Found (404)');
      } else if (response.status === 500) {
        throw new Error('Server Error (500)');
      } else {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo backend server đang chạy.');
    }
    console.error('Template Classrooms API Request failed:', error);
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

export interface TemplateClassroomPayload {
  name: string
  code?: string | null
  description?: string | null
  subject_id?: string | null
  capacity?: number | null
}

export interface CreateClassroomFromTemplatePayload {
  template_id: string
  name: string
  code: string
  teacher_id?: string | null
  subject_id?: string | null
  campus_id?: string | null
  capacity?: number | null
  tuition_per_session?: number | null
  sessions_per_week?: number | null
  open_date?: string | null
  close_date?: string | null
  copy_lessons?: boolean
  copy_assignments?: boolean
  student_ids?: string[]
}

export interface TemplateClassroom {
  id: string
  name: string
  code?: string | null
  description?: string | null
  subject_id?: string | null
  capacity?: number | null
  is_template: boolean
  created_at?: string | null
  updated_at?: string | null
}

export const templateClassroomsApi = {
  // List all templates
  list: (params?: { skip?: number; limit?: number; subject_id?: string }) =>
    apiRequest(buildUrl('/api/template-classrooms/', params), { method: 'GET' }),

  // Get a single template
  get: (id: string) => 
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${id}`, { method: 'GET' }),

  // Create a new template
  create: (data: TemplateClassroomPayload) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/`, { method: 'POST', body: data }),

  // Update a template
  update: (id: string, data: Partial<TemplateClassroomPayload>) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${id}`, { method: 'PUT', body: data }),

  // Delete a template
  remove: (id: string) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${id}`, { method: 'DELETE' }),

  // Create classroom from template
  createClassroomFromTemplate: (data: CreateClassroomFromTemplatePayload) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${data.template_id}/create-classroom`, { 
      method: 'POST', 
      body: data 
    }),

  // Get template usage history
  getUsage: (templateId: string) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${templateId}/usage`, { method: 'GET' }),

  // Get template lessons
  getLessons: (templateId: string) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${templateId}/lessons`, { method: 'GET' }),

  // Get template assignments
  getAssignments: (templateId: string) =>
    apiRequest(`${API_BASE_URL}/api/template-classrooms/${templateId}/assignments`, { method: 'GET' }),
};

export default templateClassroomsApi;

