-- Phase 1 Migration - Compatible với schema hiện tại
-- Chỉ tạo các bảng/cột mới, không thay đổi cấu trúc hiện có

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USER ROLES (nếu chưa có) ====================
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ==================== NOTIFICATIONS - Thêm columns mới ====================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Thêm các columns mới cho Phase 1 notifications
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'notification_type') THEN
            ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50);
            -- Cập nhật dữ liệu: map các giá trị cũ sang giá trị mới
            UPDATE notifications SET notification_type = CASE 
                WHEN type IN ('info', 'success', 'warning', 'error', 'system') THEN type
                WHEN type IS NULL THEN 'info'
                ELSE 'info'  -- Default cho các giá trị không hợp lệ
            END WHERE notification_type IS NULL;
            -- Thêm constraint sau khi đã cập nhật dữ liệu
            ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
                CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'system'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_type') THEN
            ALTER TABLE notifications ADD COLUMN target_type VARCHAR(50);
            UPDATE notifications SET target_type = CASE 
                WHEN user_id IS NOT NULL THEN 'user'
                WHEN entity_type IS NOT NULL THEN entity_type
                ELSE 'all'
            END WHERE target_type IS NULL;
            ALTER TABLE notifications ADD CONSTRAINT notifications_target_type_check 
                CHECK (target_type IN ('user', 'role', 'classroom', 'all'));
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_id') THEN
            ALTER TABLE notifications ADD COLUMN target_id UUID;
            UPDATE notifications SET target_id = user_id WHERE target_id IS NULL AND user_id IS NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
            ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
            ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'expires_at') THEN
            ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'created_by') THEN
            ALTER TABLE notifications ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== AUDIT LOGS ====================
-- Tạo bảng mới (không trùng với activity_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path VARCHAR(500),
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== REPORTS & ANALYTICS ====================
CREATE TABLE IF NOT EXISTS report_definitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    report_type VARCHAR(50) NOT NULL,
    query_template TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    is_system_report BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_definition_id UUID REFERENCES report_definitions(id) ON DELETE CASCADE,
    executed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    result_data JSONB,
    file_url VARCHAR(500),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id) WHERE target_type IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(target_id, is_read) WHERE target_type = 'user';
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_user_id ON report_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_created_at ON report_executions(created_at DESC);

-- ==================== INITIAL DATA ====================
-- Insert default notification templates
INSERT INTO notification_templates (name, title_template, message_template, notification_type, variables) VALUES
    ('student_absent', 'Học sinh vắng mặt', 'Học sinh {{student_name}} vắng mặt vào ngày {{date}}', 'warning', '["student_name", "date"]'::jsonb),
    ('assignment_due', 'Bài tập sắp đến hạn', 'Bài tập {{assignment_title}} sẽ đến hạn vào {{due_date}}', 'info', '["assignment_title", "due_date"]'::jsonb),
    ('payment_received', 'Đã nhận thanh toán', 'Đã nhận thanh toán {{amount}} VNĐ từ {{student_name}}', 'success', '["amount", "student_name"]'::jsonb),
    ('system_announcement', 'Thông báo hệ thống', '{{message}}', 'info', '["message"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default report definitions
INSERT INTO report_definitions (name, description, report_type, is_system_report) VALUES
    ('student_performance', 'Báo cáo học tập học sinh', 'student', TRUE),
    ('classroom_performance', 'Báo cáo học tập lớp học', 'classroom', TRUE),
    ('teacher_summary', 'Báo cáo tổng hợp giáo viên', 'teacher', TRUE),
    ('finance_summary', 'Báo cáo tài chính tổng hợp', 'finance', TRUE),
    ('attendance_statistics', 'Thống kê điểm danh', 'attendance', TRUE)
ON CONFLICT (name) DO NOTHING;

