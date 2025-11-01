-- Add discount_percent column to student_payments table
-- Thêm cột chiết khấu % vào bảng student_payments

ALTER TABLE student_payments ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100);

