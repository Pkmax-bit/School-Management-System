-- Phase 1 Database Schema - Optimized Version
-- Báo Cáo, Phân Quyền, Thông Báo, Audit Log
-- Chạy file này trong Supabase SQL Editor

-- Enable UUID extension (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ROLES & PERMISSIONS ====================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ==================== NOTIFICATIONS ====================

-- Notifications table - Tạo mới hoặc migrate
DO $$
BEGIN
    -- Tạo bảng nếu chưa tồn tại
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'system')),
            target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('user', 'role', 'classroom', 'all')),
            target_id UUID,
            is_read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP WITH TIME ZONE,
            action_url VARCHAR(500),
            metadata JSONB DEFAULT '{}'::jsonb,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE
        );
    ELSE
        -- Thêm các columns còn thiếu nếu bảng đã tồn tại
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_type') THEN
            ALTER TABLE notifications ADD COLUMN target_type VARCHAR(50);
            UPDATE notifications SET target_type = 'all' WHERE target_type IS NULL;
            ALTER TABLE notifications ADD CONSTRAINT notifications_target_type_check 
                CHECK (target_type IN ('user', 'role', 'classroom', 'all'));
            ALTER TABLE notifications ALTER COLUMN target_type SET NOT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target_id') THEN
            ALTER TABLE notifications ADD COLUMN target_id UUID;
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

-- Roles & Permissions indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Notifications indexes (chỉ tạo nếu bảng tồn tại)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(target_id, is_read) WHERE target_type = 'user';
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;
    END IF;
END $$;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_report_executions_report_id ON report_executions(report_definition_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_user_id ON report_executions(executed_by);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_created_at ON report_executions(created_at DESC);

-- ==================== INITIAL DATA ====================

-- Insert default system roles
INSERT INTO roles (name, description, is_system_role) VALUES
    ('admin', 'Administrator - Full system access', TRUE),
    ('teacher', 'Teacher - Manage classes and students', TRUE),
    ('student', 'Student - View and submit assignments', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, module, action, description) VALUES
    ('teachers.create', 'teachers', 'create', 'Create new teachers'),
    ('teachers.read', 'teachers', 'read', 'View teachers'),
    ('teachers.update', 'teachers', 'update', 'Update teachers'),
    ('teachers.delete', 'teachers', 'delete', 'Delete teachers'),
    ('teachers.manage', 'teachers', 'manage', 'Full management of teachers'),
    ('students.create', 'students', 'create', 'Create new students'),
    ('students.read', 'students', 'read', 'View students'),
    ('students.update', 'students', 'update', 'Update students'),
    ('students.delete', 'students', 'delete', 'Delete students'),
    ('students.manage', 'students', 'manage', 'Full management of students'),
    ('subjects.create', 'subjects', 'create', 'Create new subjects'),
    ('subjects.read', 'subjects', 'read', 'View subjects'),
    ('subjects.update', 'subjects', 'update', 'Update subjects'),
    ('subjects.delete', 'subjects', 'delete', 'Delete subjects'),
    ('classrooms.create', 'classrooms', 'create', 'Create new classrooms'),
    ('classrooms.read', 'classrooms', 'read', 'View classrooms'),
    ('classrooms.update', 'classrooms', 'update', 'Update classrooms'),
    ('classrooms.delete', 'classrooms', 'delete', 'Delete classrooms'),
    ('finance.read', 'finance', 'read', 'View financial data'),
    ('finance.create', 'finance', 'create', 'Create financial records'),
    ('finance.update', 'finance', 'update', 'Update financial records'),
    ('finance.manage', 'finance', 'manage', 'Full management of finances'),
    ('reports.read', 'reports', 'read', 'View reports'),
    ('reports.create', 'reports', 'create', 'Create custom reports'),
    ('reports.export', 'reports', 'export', 'Export reports'),
    ('system.settings', 'system', 'manage', 'Manage system settings'),
    ('system.users', 'system', 'manage', 'Manage users and roles')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

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

