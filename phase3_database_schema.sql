-- Phase 3 Database Schema
-- Course Management, Messaging, System Customization, Business Intelligence

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== COURSE MANAGEMENT ====================

CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id UUID, -- Optional, no foreign key
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    start_date DATE,
    end_date DATE,
    total_hours INTEGER DEFAULT 0,
    credit_hours NUMERIC(3,1) DEFAULT 0,
    max_students INTEGER,
    current_students INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'archived')),
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assistant_instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    curriculum_id UUID, -- Reference to curriculum
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    enrollment_status VARCHAR(20) NOT NULL CHECK (enrollment_status IN ('pending', 'active', 'completed', 'dropped', 'suspended')),
    final_grade NUMERIC(5,2),
    final_grade_letter VARCHAR(5),
    completion_date DATE,
    completion_percentage NUMERIC(5,2) DEFAULT 0,
    attendance_percentage NUMERIC(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

CREATE TABLE IF NOT EXISTS curricula (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20),
    academic_level VARCHAR(50), -- elementary, middle, high, university
    subject_id UUID, -- Optional
    total_units INTEGER DEFAULT 0,
    total_hours INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_standard BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curriculum_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    curriculum_id UUID REFERENCES curricula(id) ON DELETE CASCADE NOT NULL,
    unit_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    learning_objectives TEXT[],
    duration_hours INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    prerequisites TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(curriculum_id, unit_number)
);

CREATE TABLE IF NOT EXISTS curriculum_lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    curriculum_unit_id UUID REFERENCES curriculum_units(id) ON DELETE CASCADE NOT NULL,
    lesson_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    lesson_type VARCHAR(50) CHECK (lesson_type IN ('lecture', 'practice', 'lab', 'assignment', 'exam', 'project')),
    duration_minutes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    materials JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(curriculum_unit_id, lesson_number)
);

CREATE TABLE IF NOT EXISTS course_materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('document', 'video', 'audio', 'link', 'assignment', 'quiz')),
    file_id UUID, -- Reference to media_library
    url TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    publish_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    curriculum_unit_id UUID REFERENCES curriculum_units(id) ON DELETE SET NULL,
    curriculum_lesson_id UUID REFERENCES curriculum_lessons(id) ON DELETE SET NULL,
    progress_percentage NUMERIC(5,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, student_id, curriculum_lesson_id)
);

-- Indexes for Course Management
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status ON course_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_curricula_subject ON curricula(subject_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_units_curriculum ON curriculum_units(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_unit ON curriculum_lessons(curriculum_unit_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course ON course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_student ON course_progress(course_id, student_id);

-- ==================== MESSAGING SYSTEM ====================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_type VARCHAR(50) NOT NULL CHECK (conversation_type IN ('direct', 'group', 'classroom', 'course', 'announcement')),
    title VARCHAR(255),
    description TEXT,
    entity_type VARCHAR(50), -- classroom, course, etc.
    entity_id UUID,
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER DEFAULT 0,
    is_muted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'image', 'file', 'system', 'announcement')),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    read_by JSONB DEFAULT '[]'::jsonb, -- Array of user IDs who read this message
    reactions JSONB DEFAULT '{}'::jsonb, -- {emoji: [user_ids]}
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_reads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS forums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    entity_type VARCHAR(50), -- course, classroom, etc.
    entity_id UUID,
    is_public BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    post_count INTEGER DEFAULT 0,
    last_post_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    forum_id UUID REFERENCES forums(id) ON DELETE CASCADE NOT NULL,
    parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE, -- For replies
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    attachments JSONB DEFAULT '[]'::jsonb,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forum_post_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Indexes for Messaging
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_entity ON conversations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum ON forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON forum_posts(parent_post_id);

-- ==================== SYSTEM CUSTOMIZATION ====================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'file')),
    category VARCHAR(50) NOT NULL, -- general, academic, email, sms, payment, branding, theme
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Can be accessed by non-admin users
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    logo_url TEXT,
    favicon_url TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    tax_id VARCHAR(50),
    registration_number VARCHAR(100),
    established_year INTEGER,
    description TEXT,
    mission TEXT,
    vision TEXT,
    values TEXT[],
    social_media JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    semester VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    grading_scale JSONB DEFAULT '{}'::jsonb, -- {A: 90-100, B: 80-89, ...}
    passing_grade NUMERIC(5,2) DEFAULT 50.0,
    max_attendance_percentage NUMERIC(5,2) DEFAULT 75.0,
    class_duration_minutes INTEGER DEFAULT 45,
    school_days_per_week INTEGER DEFAULT 5,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('smtp', 'sendgrid', 'ses', 'mailgun', 'custom')),
    host VARCHAR(255),
    port INTEGER,
    username VARCHAR(255),
    password_encrypted TEXT, -- Encrypted password
    use_tls BOOLEAN DEFAULT TRUE,
    use_ssl BOOLEAN DEFAULT FALSE,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    api_key_encrypted TEXT, -- For service providers
    is_active BOOLEAN DEFAULT FALSE,
    test_email VARCHAR(255),
    last_tested_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('twilio', 'nexmo', 'aws_sns', 'custom')),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    sender_id VARCHAR(50),
    is_active BOOLEAN DEFAULT FALSE,
    test_phone VARCHAR(50),
    last_tested_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('stripe', 'paypal', 'momo', 'vnpay', 'custom')),
    provider_name VARCHAR(100),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    merchant_id VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    is_test_mode BOOLEAN DEFAULT TRUE,
    supported_currencies TEXT[] DEFAULT ARRAY['USD', 'VND'],
    default_currency VARCHAR(10) DEFAULT 'VND',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS theme_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL,
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    accent_color VARCHAR(20),
    font_family VARCHAR(100),
    font_size VARCHAR(20),
    logo_url TEXT,
    favicon_url TEXT,
    background_image_url TEXT,
    custom_css TEXT,
    custom_js TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for System Customization
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_academic_settings_year ON academic_settings(academic_year);
CREATE INDEX IF NOT EXISTS idx_academic_settings_current ON academic_settings(is_current);

-- ==================== BUSINESS INTELLIGENCE ====================

CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('student_performance', 'teacher_performance', 'course_popularity', 'revenue', 'attendance', 'retention', 'engagement')),
    entity_type VARCHAR(50), -- student, teacher, course, classroom, etc.
    entity_id UUID,
    metric_value NUMERIC(10,2),
    metric_data JSONB DEFAULT '{}'::jsonb,
    period_start DATE,
    period_end DATE,
    period_type VARCHAR(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prediction_type VARCHAR(50) NOT NULL CHECK (prediction_type IN ('student_success', 'dropout_risk', 'revenue_forecast', 'enrollment_forecast', 'performance_trend')),
    entity_type VARCHAR(50),
    entity_id UUID,
    predicted_value NUMERIC(10,2),
    confidence_score NUMERIC(5,2), -- 0-100
    prediction_data JSONB DEFAULT '{}'::jsonb,
    factors JSONB DEFAULT '[]'::jsonb, -- Factors that influenced the prediction
    predicted_for_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_dashboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB NOT NULL, -- Dashboard layout configuration
    widgets JSONB DEFAULT '[]'::jsonb, -- Array of widget configurations
    is_public BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dashboard_id UUID REFERENCES custom_dashboards(id) ON DELETE CASCADE NOT NULL,
    widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN ('chart', 'table', 'metric', 'list', 'map', 'calendar')),
    widget_name VARCHAR(255) NOT NULL,
    data_source VARCHAR(100), -- API endpoint or query
    config JSONB DEFAULT '{}'::jsonb,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 4,
    height INTEGER DEFAULT 3,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    report_config JSONB NOT NULL, -- Report configuration
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
    schedule_config JSONB, -- Cron expression or schedule details
    recipients JSONB DEFAULT '[]'::jsonb, -- Array of email addresses or user IDs
    format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Business Intelligence
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_type ON analytics_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_entity ON analytics_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period ON analytics_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_analytics_predictions_type ON analytics_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_analytics_predictions_entity ON analytics_predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON scheduled_reports(next_run_at);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES 
    ('system_name', 'School Management System', 'string', 'general', 'Tên hệ thống', TRUE),
    ('system_version', '1.0.0', 'string', 'general', 'Phiên bản hệ thống', TRUE),
    ('timezone', 'Asia/Ho_Chi_Minh', 'string', 'general', 'Múi giờ', TRUE),
    ('language', 'vi', 'string', 'general', 'Ngôn ngữ mặc định', TRUE),
    ('date_format', 'DD/MM/YYYY', 'string', 'general', 'Định dạng ngày tháng', TRUE),
    ('time_format', '24h', 'string', 'general', 'Định dạng giờ', TRUE),
    ('max_file_size_mb', '50', 'number', 'general', 'Kích thước file tối đa (MB)', FALSE),
    ('session_timeout_minutes', '30', 'number', 'general', 'Thời gian timeout session (phút)', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default school info (single row)
INSERT INTO school_info (name, short_name, established_year)
VALUES ('School Name', 'SN', 2020)
ON CONFLICT DO NOTHING;

