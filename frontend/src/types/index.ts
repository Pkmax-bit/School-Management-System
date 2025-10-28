export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  teacher_code: string;
  phone?: string;
  address?: string;
  specialization?: string;
  experience_years?: string;
  education_level?: string;
  degree_name?: string;
  created_at?: string;
  updated_at?: string;
  // User info (from users table)
  name?: string;
  email?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
}

export interface Student {
  id: string;
  user_id: string;
  student_code: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  parent_name?: string;
  parent_phone?: string;
  classroom_id?: string;
  created_at?: string;
  updated_at?: string;
  // User info (from users table)
  name?: string;
  email?: string;
  avatar?: string;
  status?: 'active' | 'inactive';
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSubjectRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSubjectRequest {
  name?: string;
  code?: string;
  description?: string;
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  students: number;
  schedule: string;
}

export interface Finance {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}