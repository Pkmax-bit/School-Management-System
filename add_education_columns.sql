-- Thêm cột học vấn và tên bằng cấp vào bảng teachers
ALTER TABLE public.teachers 
ADD COLUMN education_level character varying(100),
ADD COLUMN degree_name character varying(255);

-- Thêm comment cho các cột mới
COMMENT ON COLUMN public.teachers.education_level IS 'Trình độ học vấn (Cử nhân, Thạc sĩ, Tiến sĩ, ...)';
COMMENT ON COLUMN public.teachers.degree_name IS 'Tên bằng cấp (Kỹ thuật phần mềm, Quản trị kinh doanh, ...)';

-- Tạo index cho cột education_level để tìm kiếm nhanh hơn
CREATE INDEX IF NOT EXISTS idx_teachers_education_level ON public.teachers USING btree (education_level);

-- Cập nhật trigger để tự động cập nhật updated_at
-- (Trigger đã tồn tại, không cần tạo mới)

