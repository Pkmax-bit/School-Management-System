-- Create rooms table for managing rooms in campuses
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 30,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campus_id, code)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_campus_id ON rooms(campus_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

