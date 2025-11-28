-- Script kiểm tra database cho hệ thống quản lý điểm số
-- Chạy script này để xem các bảng và cột đã có đầy đủ chưa

-- 1. Kiểm tra bảng assignment_submissions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'assignment_submissions'
ORDER BY ordinal_position;

-- 2. Kiểm tra các cột cần thiết có tồn tại không
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        AND column_name = 'files'
    ) THEN '✓ Cột files đã có' ELSE '✗ Cột files CHƯA có' END as files_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        AND column_name = 'links'
    ) THEN '✓ Cột links đã có' ELSE '✗ Cột links CHƯA có' END as links_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        AND column_name = 'feedback'
    ) THEN '✓ Cột feedback đã có' ELSE '✗ Cột feedback CHƯA có' END as feedback_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        AND column_name = 'score'
    ) THEN '✓ Cột score đã có' ELSE '✗ Cột score CHƯA có' END as score_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        AND column_name = 'is_graded'
    ) THEN '✓ Cột is_graded đã có' ELSE '✗ Cột is_graded CHƯA có' END as is_graded_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' 
        AND column_name = 'graded_at'
    ) THEN '✓ Cột graded_at đã có' ELSE '✗ Cột graded_at CHƯA có' END as graded_at_status;

-- 3. Kiểm tra các bảng liên quan
SELECT 
    'assignments' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'assignments'

UNION ALL

SELECT 
    'assignment_questions' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'assignment_questions'

UNION ALL

SELECT 
    'assignment_submissions' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'assignment_submissions'

UNION ALL

SELECT 
    'students' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'students'

UNION ALL

SELECT 
    'teachers' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'teachers';

-- 4. Kiểm tra các index đã tạo
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'assignment_submissions'
ORDER BY indexname;


