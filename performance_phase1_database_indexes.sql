-- Phase 1: Database Indexes for Performance Optimization
-- Tạo indexes cho các queries thường dùng để cải thiện tốc độ

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_classroom_id ON students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- Teachers indexes
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_code ON teachers(teacher_code);
CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON teachers(created_at DESC);

-- Classrooms indexes
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_campus_id ON classrooms(campus_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_classroom_code ON classrooms(classroom_code);
CREATE INDEX IF NOT EXISTS idx_classrooms_created_at ON classrooms(created_at DESC);

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_created_at ON subjects(created_at DESC);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_schedules_classroom_id ON schedules(classroom_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher_id ON schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedules_subject_id ON schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedules_room_id ON schedules(room_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_date_classroom ON schedules(date, classroom_id);

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON assignments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);

-- Assignment Classrooms (many-to-many)
CREATE INDEX IF NOT EXISTS idx_assignment_classrooms_assignment_id ON assignment_classrooms(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_classrooms_classroom_id ON assignment_classrooms(classroom_id);

-- Assignment Submissions indexes
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_at ON assignment_submissions(submitted_at DESC);

-- Attendances indexes
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_classroom_id ON attendances(classroom_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_student_date ON attendances(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendances_classroom_date ON attendances(classroom_id, date);

-- Finances indexes
CREATE INDEX IF NOT EXISTS idx_finances_type ON finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(date);
CREATE INDEX IF NOT EXISTS idx_finances_created_at ON finances(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finances_category_id ON finances(category_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_classroom_id ON payments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments(paid_date);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_classroom_id ON lessons(classroom_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at DESC);

-- Users indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_classroom_active ON students(classroom_id) WHERE classroom_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_active ON assignments(teacher_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_payments_student_pending ON payments(student_id) WHERE status = 'pending';

-- Analyze tables after creating indexes
ANALYZE students;
ANALYZE teachers;
ANALYZE classrooms;
ANALYZE subjects;
ANALYZE schedules;
ANALYZE assignments;
ANALYZE attendances;
ANALYZE finances;
ANALYZE payments;
ANALYZE lessons;
ANALYZE users;

