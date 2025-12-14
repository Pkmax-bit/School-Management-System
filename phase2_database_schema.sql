-- Phase 2 Database Schema
-- Import/Export, Exams, File Management, Calendar & Events

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== IMPORT/EXPORT ====================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('students', 'teachers', 'grades', 'schedules', 'attendance')),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_log JSONB DEFAULT '[]'::jsonb,
    result_data JSONB,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('students', 'teachers', 'grades', 'schedules', 'reports', 'all')),
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('excel', 'csv', 'pdf', 'json')),
    filters JSONB DEFAULT '{}'::jsonb,
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS import_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL,
    description TEXT,
    sample_file_url TEXT,
    field_mapping JSONB DEFAULT '{}'::jsonb,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== EXAMS & ASSESSMENTS ====================

CREATE TABLE IF NOT EXISTS question_banks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank')),
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT,
    correct_answers JSONB DEFAULT '[]'::jsonb,
    points DECIMAL(10,2) DEFAULT 1.0,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    explanation TEXT,
    tags TEXT[],
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('quiz', 'midterm', 'final', 'assignment', 'practice')),
    duration_minutes INTEGER,
    total_points DECIMAL(10,2) DEFAULT 100.0,
    passing_score DECIMAL(10,2),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    is_randomized BOOLEAN DEFAULT FALSE,
    show_results_immediately BOOLEAN DEFAULT FALSE,
    allow_review BOOLEAN DEFAULT TRUE,
    anti_cheat_enabled BOOLEAN DEFAULT FALSE,
    fullscreen_required BOOLEAN DEFAULT FALSE,
    disable_copy_paste BOOLEAN DEFAULT FALSE,
    webcam_monitoring BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    points DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    percentage DECIMAL(5,2),
    is_passed BOOLEAN,
    status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'submitted', 'graded', 'expired')),
    answers JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_attempt_answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_json JSONB,
    is_correct BOOLEAN,
    points_earned DECIMAL(10,2) DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== FILE MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS file_folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_folder_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
    description TEXT,
    entity_type VARCHAR(50),
    entity_id UUID,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID NOT NULL, -- Reference to files table
    version_number INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, version_number)
);

CREATE TABLE IF NOT EXISTS file_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_id UUID NOT NULL, -- Reference to files table
    shared_with_type VARCHAR(50) NOT NULL CHECK (shared_with_type IN ('user', 'role', 'classroom', 'public')),
    shared_with_id UUID,
    permission VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'delete')),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'other')),
    mime_type VARCHAR(100),
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    tags TEXT[],
    description TEXT,
    folder_id UUID REFERENCES file_folders(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== CALENDAR & EVENTS ====================

CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('class', 'exam', 'holiday', 'meeting', 'event', 'deadline')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    exam_id UUID REFERENCES exams(id) ON DELETE SET NULL,
    color VARCHAR(20),
    recurrence_rule TEXT, -- iCal RRULE format
    recurrence_end_date TIMESTAMP WITH TIME ZONE,
    reminder_minutes INTEGER[],
    attendees JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_conflicts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event1_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    event2_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('time_overlap', 'room_conflict', 'teacher_conflict', 'student_conflict')),
    conflict_details JSONB DEFAULT '{}'::jsonb,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS room_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    booked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(100), -- yearly, monthly, etc.
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INDEXES ====================

-- Import/Export indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_type_status ON import_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON import_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_jobs_type_status ON export_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created_by ON export_jobs(created_by);

-- Exam indexes
CREATE INDEX IF NOT EXISTS idx_question_banks_subject ON question_banks(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(question_bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_exams_subject_classroom ON exams(subject_id, classroom_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_start_time ON exams(start_time);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_student ON exam_attempts(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_status ON exam_attempts(status);

-- File Management indexes
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON file_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_entity ON file_folders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with_type, shared_with_id);
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_folder ON media_library(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_library_entity ON media_library(entity_type, entity_id);

-- Calendar indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_classroom ON calendar_events(classroom_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_room ON calendar_events(room_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_event1 ON calendar_conflicts(event1_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_event2 ON calendar_conflicts(event2_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room_time ON room_bookings(room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_holidays_dates ON holidays(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_holidays_campus ON holidays(campus_id);

-- ==================== INITIAL DATA ====================

-- Insert default import templates
INSERT INTO import_templates (name, template_type, description, field_mapping) VALUES
    ('students_template', 'students', 'Template import học sinh', '{"name": "Họ tên", "email": "Email", "phone": "SĐT", "classroom": "Lớp"}'::jsonb),
    ('teachers_template', 'teachers', 'Template import giáo viên', '{"name": "Họ tên", "email": "Email", "phone": "SĐT", "subject": "Môn học"}'::jsonb),
    ('grades_template', 'grades', 'Template import điểm số', '{"student": "Học sinh", "assignment": "Bài tập", "score": "Điểm"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

