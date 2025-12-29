-- Create table for multiple YouTube URLs per lesson
CREATE TABLE IF NOT EXISTS lesson_youtube_urls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    youtube_url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_youtube_urls_lesson_id ON lesson_youtube_urls(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_youtube_urls_sort_order ON lesson_youtube_urls(sort_order);

-- Add comments
COMMENT ON TABLE lesson_youtube_urls IS 'Multiple YouTube URLs for lessons';
COMMENT ON COLUMN lesson_youtube_urls.lesson_id IS 'Reference to the lesson';
COMMENT ON COLUMN lesson_youtube_urls.youtube_url IS 'YouTube video URL';
COMMENT ON COLUMN lesson_youtube_urls.title IS 'Optional title for the video';
COMMENT ON COLUMN lesson_youtube_urls.description IS 'Optional description for the video';
COMMENT ON COLUMN lesson_youtube_urls.sort_order IS 'Display order of videos';
