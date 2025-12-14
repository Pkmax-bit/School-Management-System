-- Phase 1 Migration Fix
-- Sửa lỗi nếu bảng notifications đã tồn tại nhưng thiếu các columns

-- Kiểm tra và thêm các columns còn thiếu
DO $$
BEGIN
    -- Kiểm tra xem bảng notifications có tồn tại không
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
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
            RAISE NOTICE 'Added target_type column to notifications table';
        END IF;
        
        -- Thêm target_id nếu thiếu
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'target_id'
        ) THEN
            ALTER TABLE notifications ADD COLUMN target_id UUID;
            RAISE NOTICE 'Added target_id column to notifications table';
        END IF;
        
        -- Thêm action_url nếu thiếu
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'action_url'
        ) THEN
            ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500);
            RAISE NOTICE 'Added action_url column to notifications table';
        END IF;
        
        -- Thêm metadata nếu thiếu
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'metadata'
        ) THEN
            ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added metadata column to notifications table';
        END IF;
        
        -- Thêm expires_at nếu thiếu
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'expires_at'
        ) THEN
            ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added expires_at column to notifications table';
        END IF;
    ELSE
        RAISE NOTICE 'Table notifications does not exist yet';
    END IF;
END $$;

-- Tạo indexes nếu chưa tồn tại
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(target_id, is_read) WHERE target_type = 'user';
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

