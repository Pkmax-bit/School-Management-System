-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    storage_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    shared_classroom_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_classroom_id ON lessons(classroom_id);

-- Trigger for updated_at
CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

