-- Finance Overview Schema
-- Bảng và view cho tổng quan tài chính

-- Finance Overview Table - Lưu trữ tổng quan tài chính theo ngày/tháng
CREATE TABLE IF NOT EXISTS finance_overview (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_income DECIMAL(15,2) DEFAULT 0,
    total_expense DECIMAL(15,2) DEFAULT 0,
    profit DECIMAL(15,2) DEFAULT 0,
    total_students INT DEFAULT 0,
    total_classrooms INT DEFAULT 0,
    paid_students INT DEFAULT 0,
    pending_payments DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(period_type, period_start, period_end)
);

-- Finance Statistics Table - Thống kê chi tiết
CREATE TABLE IF NOT EXISTS finance_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stat_date DATE NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    net_profit DECIMAL(15,2) DEFAULT 0,
    expense_by_category JSONB, -- {category: amount}
    revenue_by_classroom JSONB, -- {classroom_id: amount}
    payment_summary JSONB, -- {paid: count, pending: count, overdue: count}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stat_date)
);

-- Classroom Revenue Settings - Cài đặt học phí cho lớp
CREATE TABLE IF NOT EXISTS classroom_revenue_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    tuition_per_session DECIMAL(15,2) NOT NULL DEFAULT 50000,
    sessions_per_week INT NOT NULL DEFAULT 2,
    weeks_per_month INT NOT NULL DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(classroom_id, effective_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finance_overview_period ON finance_overview(period_type, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_statistics_date ON finance_statistics(stat_date);
CREATE INDEX IF NOT EXISTS idx_classroom_revenue_settings_classroom ON classroom_revenue_settings(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_revenue_settings_active ON classroom_revenue_settings(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_finance_overview_updated_at BEFORE UPDATE ON finance_overview FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finance_statistics_updated_at BEFORE UPDATE ON finance_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classroom_revenue_settings_updated_at BEFORE UPDATE ON classroom_revenue_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: Daily Finance Summary
CREATE OR REPLACE VIEW v_daily_finance_summary AS
SELECT 
    DATE(created_at) as date,
    SUM(CASE WHEN finance_type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN finance_type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN finance_type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN finance_type = 'expense' THEN amount ELSE 0 END) as profit
FROM finances
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Monthly Finance Summary
CREATE OR REPLACE VIEW v_monthly_finance_summary AS
SELECT 
    DATE_TRUNC('month', created_at)::DATE as month,
    SUM(CASE WHEN finance_type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN finance_type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN finance_type = 'income' THEN amount ELSE 0 END) - 
    SUM(CASE WHEN finance_type = 'expense' THEN amount ELSE 0 END) as profit,
    COUNT(DISTINCT id) as transaction_count
FROM finances
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- View: Classroom Revenue Summary
CREATE OR REPLACE VIEW v_classroom_revenue_summary AS
SELECT 
    c.id as classroom_id,
    c.name as classroom_name,
    c.code as classroom_code,
    COALESCE(COUNT(DISTINCT s.id), 0) as student_count,
    COALESCE(crs.tuition_per_session, 50000) as tuition_per_session,
    COALESCE(crs.sessions_per_week, 2) as sessions_per_week,
    COALESCE(crs.weeks_per_month, 4) as weeks_per_month,
    (COALESCE(crs.tuition_per_session, 50000) * 
     COALESCE(crs.sessions_per_week, 2) * 
     COALESCE(crs.weeks_per_month, 4) * 
     COALESCE(COUNT(DISTINCT s.id), 0)) as total_revenue,
    COALESCE(SUM(CASE WHEN sp.payment_status = 'paid' THEN sp.amount ELSE 0 END), 0) as paid_amount,
    COALESCE(SUM(CASE WHEN sp.payment_status = 'pending' THEN sp.amount ELSE 0 END), 0) as pending_amount
FROM classrooms c
LEFT JOIN students s ON s.classroom_id = c.id
LEFT JOIN student_payments sp ON sp.classroom_id = c.id
LEFT JOIN LATERAL (
    SELECT * FROM classroom_revenue_settings 
    WHERE classroom_id = c.id AND is_active = TRUE
    ORDER BY effective_date DESC
    LIMIT 1
) crs ON TRUE
GROUP BY c.id, c.name, c.code, crs.tuition_per_session, crs.sessions_per_week, crs.weeks_per_month;

-- View: Payment Status Summary
CREATE OR REPLACE VIEW v_payment_status_summary AS
SELECT 
    payment_status,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT student_id) as student_count,
    COUNT(DISTINCT classroom_id) as classroom_count
FROM student_payments
GROUP BY payment_status;

-- Expense Categories Table - Danh mục chi phí
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for expense_categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_code ON expense_categories(code);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_sort ON expense_categories(sort_order);

-- Create trigger for updated_at
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default expense categories
INSERT INTO expense_categories (name, code, description, color, sort_order) VALUES
    ('Lương', 'salary', 'Chi phí lương nhân viên, giáo viên', '#EF4444', 1),
    ('Cơ sở vật chất', 'facility', 'Chi phí bảo trì, sửa chữa cơ sở vật chất', '#F59E0B', 2),
    ('Thiết bị', 'equipment', 'Chi phí mua sắm thiết bị, dụng cụ', '#3B82F6', 3),
    ('Điện nước', 'utilities', 'Chi phí điện, nước, internet', '#10B981', 4),
    ('Marketing', 'marketing', 'Chi phí quảng cáo, marketing', '#8B5CF6', 5),
    ('Khác', 'other', 'Các chi phí khác', '#6B7280', 99)
ON CONFLICT (code) DO NOTHING;

