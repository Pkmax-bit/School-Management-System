export interface LessonFile {
  id: string;
  lesson_id: string;
  file_url: string;
  file_name: string;
  storage_path?: string;
  file_size?: number;
  file_type?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  classroom_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  storage_path?: string;
  sort_order?: number;
  shared_classroom_ids?: string[];
  available_at?: string;
  assignment_id?: string;
  files?: LessonFile[];
  created_at: string;
  updated_at: string;
}

export interface LessonCreate {
  classroom_id: string;
  title: string;
  description?: string;
  files: FileList | File[];
  sort_order?: number;
  shared_classroom_ids?: string[];
  available_at?: string;
  assignment_id?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  assignment_type: string;
  total_points?: number;
  due_date?: string;
}

