-- Teachers Table Schema
-- Tạo bảng teachers cho hệ thống quản lý trường học

CREATE TABLE IF NOT EXISTS public.teachers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    subject character varying(100) NOT NULL,
    department character varying(100),
    hire_date timestamp with time zone,
    salary numeric(15,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT teachers_pkey PRIMARY KEY (id),
    CONSTRAINT teachers_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Tạo index cho email
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers USING btree (email) TABLESPACE pg_default;

-- Tạo index cho subject
CREATE INDEX IF NOT EXISTS idx_teachers_subject ON public.teachers USING btree (subject) TABLESPACE pg_default;

-- Tạo index cho department
CREATE INDEX IF NOT EXISTS idx_teachers_department ON public.teachers USING btree (department) TABLESPACE pg_default;

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

-- Insert sample data (optional)
INSERT INTO public.teachers (name, email, phone, subject, department, hire_date, salary) VALUES
('Nguyễn Văn An', 'an.nguyen@school.edu', '0123456789', 'Toán học', 'Khoa học Tự nhiên', '2023-01-15', 15000000),
('Trần Thị Bình', 'binh.tran@school.edu', '0987654321', 'Vật lý', 'Khoa học Tự nhiên', '2023-02-01', 16000000),
('Lê Văn Cường', 'cuong.le@school.edu', '0369258147', 'Hóa học', 'Khoa học Tự nhiên', '2023-03-10', 15500000),
('Phạm Thị Dung', 'dung.pham@school.edu', '0912345678', 'Văn học', 'Khoa học Xã hội', '2023-04-05', 14500000),
('Hoàng Văn Em', 'em.hoang@school.edu', '0923456789', 'Lịch sử', 'Khoa học Xã hội', '2023-05-20', 14000000)
ON CONFLICT (email) DO NOTHING;

