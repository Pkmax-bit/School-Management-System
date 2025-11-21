export interface Lesson {
  id: string;
  classroom_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_name?: string;
  storage_path?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonCreate {
  classroom_id: string;
  title: string;
  description?: string;
  file: File;
}

