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
  created_at: string;
  updated_at: string;
}

export interface LessonCreate {
  classroom_id: string;
  title: string;
  description?: string;
  file: File;
  sort_order?: number;
  shared_classroom_ids?: string[];
}

