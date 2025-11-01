-- Drop created_by column from expense_categories table
-- Xóa cột created_by khỏi bảng expense_categories (không cần ghi ai tạo)

ALTER TABLE expense_categories DROP COLUMN IF EXISTS created_by;

