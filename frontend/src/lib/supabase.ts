/**
 * Supabase Client Configuration
 * Cấu hình Supabase client cho frontend
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-key'

// Kiểm tra nếu keys hợp lệ
const isValidSupabaseConfig = supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseAnonKey !== 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export flag để kiểm tra config
export { isValidSupabaseConfig }

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          role: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          user_id: string
          teacher_code: string
          phone?: string
          address?: string
          specialization?: string
          experience_years?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          teacher_code: string
          phone?: string
          address?: string
          specialization?: string
          experience_years?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          teacher_code?: string
          phone?: string
          address?: string
          specialization?: string
          experience_years?: string
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          student_code: string
          phone?: string
          address?: string
          date_of_birth?: string
          parent_name?: string
          parent_phone?: string
          classroom_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          student_code: string
          phone?: string
          address?: string
          date_of_birth?: string
          parent_name?: string
          parent_phone?: string
          classroom_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          student_code?: string
          phone?: string
          address?: string
          date_of_birth?: string
          parent_name?: string
          parent_phone?: string
          classroom_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      classrooms: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          capacity: number
          teacher_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          capacity?: number
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          capacity?: number
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          classroom_id: string
          subject_id: string
          teacher_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          classroom_id: string
          subject_id: string
          teacher_id: string
          day_of_week: number
          start_time: string
          end_time: string
          room?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          classroom_id?: string
          subject_id?: string
          teacher_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          room?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description?: string
          classroom_id: string
          subject_id: string
          teacher_id: string
          assignment_type: string
          total_points: number
          due_date?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          classroom_id: string
          subject_id: string
          teacher_id: string
          assignment_type: string
          total_points?: number
          due_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          classroom_id?: string
          subject_id?: string
          teacher_id?: string
          assignment_type?: string
          total_points?: number
          due_date?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assignment_questions: {
        Row: {
          id: string
          assignment_id: string
          question_text: string
          question_type: string
          points: number
          options?: any
          correct_answer?: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          question_text: string
          question_type: string
          points?: number
          options?: any
          correct_answer?: string
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          question_text?: string
          question_type?: string
          points?: number
          options?: any
          correct_answer?: string
          order?: number
          created_at?: string
        }
      }
      assignment_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          answers: any
          score?: number
          is_graded: boolean
          submitted_at: string
          graded_at?: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          answers: any
          score?: number
          is_graded?: boolean
          submitted_at?: string
          graded_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          answers?: any
          score?: number
          is_graded?: boolean
          submitted_at?: string
          graded_at?: string
        }
      }
      attendances: {
        Row: {
          id: string
          student_id: string
          classroom_id: string
          date: string
          is_present: boolean
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          classroom_id: string
          date: string
          is_present?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          classroom_id?: string
          date?: string
          is_present?: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      finances: {
        Row: {
          id: string
          title: string
          description?: string
          amount: number
          finance_type: string
          category: string
          date: string
          is_recurring: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          amount: number
          finance_type: string
          category: string
          date: string
          is_recurring?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          amount?: number
          finance_type?: string
          category?: string
          date?: string
          is_recurring?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          classroom_id: string
          subject_id: string
          teacher_id: string
          grade_type: 'midterm' | 'final' | 'regular' | 'other'
          score: number
          max_score: number
          notes?: string
          graded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          classroom_id: string
          subject_id: string
          teacher_id: string
          grade_type: 'midterm' | 'final' | 'regular' | 'other'
          score: number
          max_score?: number
          notes?: string
          graded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          classroom_id?: string
          subject_id?: string
          teacher_id?: string
          grade_type?: 'midterm' | 'final' | 'regular' | 'other'
          score?: number
          max_score?: number
          notes?: string
          graded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
