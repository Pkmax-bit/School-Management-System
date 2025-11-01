-- Finance and Payment Schema Updates
-- Cập nhật schema cho quản lý tài chính và thanh toán học sinh

-- Add classroom_id to finances table
ALTER TABLE finances ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES classrooms(id) ON DELETE SET NULL;
ALTER TABLE finances ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE SET NULL;

-- Student Payments table - Theo dõi thanh toán của học sinh
CREATE TABLE IF NOT EXISTS student_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'other')),
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    receipt_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classroom Tuition table - Số tiền học phí của lớp học
CREATE TABLE IF NOT EXISTS classroom_tuitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    semester VARCHAR(50),
    academic_year VARCHAR(20),
    due_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(classroom_id, semester, academic_year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finances_classroom_id ON finances(classroom_id);
CREATE INDEX IF NOT EXISTS idx_finances_student_id ON finances(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_student_id ON student_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_classroom_id ON student_payments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_student_payments_status ON student_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_student_payments_date ON student_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_classroom_tuitions_classroom_id ON classroom_tuitions(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_tuitions_active ON classroom_tuitions(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_student_payments_updated_at BEFORE UPDATE ON student_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classroom_tuitions_updated_at BEFORE UPDATE ON classroom_tuitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

