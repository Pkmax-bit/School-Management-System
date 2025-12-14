-- Script kiểm tra và sửa bảng notifications
-- Chạy script này trước khi chạy phase1_database_schema.sql

-- Kiểm tra cấu trúc hiện tại của bảng notifications
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Thêm các columns còn thiếu
DO $$
BEGIN
    -- Thêm target_type nếu thiếu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'target_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN target_type VARCHAR(50);
        UPDATE notifications SET target_type = 'all' WHERE target_type IS NULL;
        ALTER TABLE notifications ADD CONSTRAINT notifications_target_type_check 
            CHECK (target_type IN ('user', 'role', 'classroom', 'all'));
        ALTER TABLE notifications ALTER COLUMN target_type SET NOT NULL;
        RAISE NOTICE '✓ Added target_type column';
    ELSE
        RAISE NOTICE '✓ target_type column already exists';
    END IF;
    
    -- Thêm target_id nếu thiếu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'target_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN target_id UUID;
        RAISE NOTICE '✓ Added target_id column';
    ELSE
        RAISE NOTICE '✓ target_id column already exists';
    END IF;
    
    -- Thêm action_url nếu thiếu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'action_url'
    ) THEN
        ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500);
        RAISE NOTICE '✓ Added action_url column';
    ELSE
        RAISE NOTICE '✓ action_url column already exists';
    END IF;
    
    -- Thêm metadata nếu thiếu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✓ Added metadata column';
    ELSE
        RAISE NOTICE '✓ metadata column already exists';
    END IF;
    
    -- Thêm expires_at nếu thiếu
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ Added expires_at column';
    ELSE
        RAISE NOTICE '✓ expires_at column already exists';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- Tạo indexes sau khi đảm bảo các columns đã tồn tại
DO $$
BEGIN
    -- Tạo index cho target_type và target_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notifications' AND indexname = 'idx_notifications_target'
    ) THEN
        CREATE INDEX idx_notifications_target ON notifications(target_type, target_id);
        RAISE NOTICE '✓ Created idx_notifications_target';
    END IF;
    
    -- Tạo index cho user read
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notifications' AND indexname = 'idx_notifications_user_read'
    ) THEN
        CREATE INDEX idx_notifications_user_read ON notifications(target_id, is_read) 
        WHERE target_type = 'user';
        RAISE NOTICE '✓ Created idx_notifications_user_read';
    END IF;
    
    -- Tạo index cho created_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notifications' AND indexname = 'idx_notifications_created_at'
    ) THEN
        CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
        RAISE NOTICE '✓ Created idx_notifications_created_at';
    END IF;
    
    -- Tạo index cho expires_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'notifications' AND indexname = 'idx_notifications_expires_at'
    ) THEN
        CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) 
        WHERE expires_at IS NOT NULL;
        RAISE NOTICE '✓ Created idx_notifications_expires_at';
    END IF;
    
    RAISE NOTICE 'All indexes created successfully!';
END $$;

-- Kiểm tra lại cấu trúc sau khi sửa
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

