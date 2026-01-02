export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  // Multiple files support
  file_urls?: string[];
  file_names?: string[];
  storage_paths?: string[];
  // Backward compatibility
  file_url?: string;
  file_name?: string;
  storage_path?: string;
  video_url?: string;
  youtube_urls?: (string | {url: string, title: string})[];
  created_at: string;
  available_at?: string;
  sort_order?: number;
  classroom_id: string;
  shared_classroom_ids?: string[];
  subject?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name?: string;
    email?: string;
  };
}
