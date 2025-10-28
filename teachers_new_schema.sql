-- Teachers Table Schema - Updated Version
-- Tạo bảng teachers với foreign key đến users table

CREATE TABLE IF NOT EXISTS public.teachers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    user_id uuid NOT NULL,
    teacher_code character varying(50) NOT NULL,
    phone character varying(20) NULL,
    address text NULL,
    specialization character varying(255) NULL,
    experience_years character varying(50) NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT teachers_pkey PRIMARY KEY (id),
    CONSTRAINT teachers_teacher_code_key UNIQUE (teacher_code),
    CONSTRAINT teachers_user_id_key UNIQUE (user_id),
    CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Tạo index cho teacher_code
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_code ON public.teachers USING btree (teacher_code) TABLESPACE pg_default;

-- Tạo index cho user_id
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers USING btree (user_id) TABLESPACE pg_default;

-- Tạo index cho specialization
CREATE INDEX IF NOT EXISTS idx_teachers_specialization ON public.teachers USING btree (specialization) TABLESPACE pg_default;

-- Tạo trigger để cập nhật updated_at
CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_teachers_updated_at 
    BEFORE UPDATE ON public.teachers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_teachers_updated_at();

-- Tạo RLS policies (nếu cần)
-- ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Policy cho admin (có thể xem tất cả)
-- CREATE POLICY "Admin can view all teachers" ON public.teachers
--     FOR SELECT USING (auth.role() = 'admin');

-- Policy cho admin (có thể insert)
-- CREATE POLICY "Admin can insert teachers" ON public.teachers
--     FOR INSERT WITH CHECK (auth.role() = 'admin');

-- Policy cho admin (có thể update)
-- CREATE POLICY "Admin can update teachers" ON public.teachers
--     FOR UPDATE USING (auth.role() = 'admin');

-- Policy cho admin (có thể delete)
-- CREATE POLICY "Admin can delete teachers" ON public.teachers
--     FOR DELETE USING (auth.role() = 'admin');

-- Insert sample data (cần có users table trước)
-- INSERT INTO public.teachers (user_id, teacher_code, phone, address, specialization, experience_years) VALUES
-- ('user-uuid-1', 'GV001', '0123456789', '123 Đường ABC, Quận 1, TP.HCM', 'Toán học', '5'),
-- ('user-uuid-2', 'GV002', '0987654321', '456 Đường XYZ, Quận 2, TP.HCM', 'Vật lý', '3'),
-- ('user-uuid-3', 'GV003', '0369258147', '789 Đường DEF, Quận 3, TP.HCM', 'Hóa học', '7')
-- ON CONFLICT (teacher_code) DO NOTHING;

