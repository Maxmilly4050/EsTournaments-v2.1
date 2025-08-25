
-- Test script to verify the foreign key relationship works
-- Run this in your PostgreSQL database after applying the schema

-- 1. Check if notifications table exists with proper structure
\d+ notifications;

-- 2. Verify foreign key constraints exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name='notifications';

-- 3. Test basic functionality (replace UUIDs with real values)
-- INSERT INTO notifications (user_id, tournament_id, type, title, message) 
-- VALUES ('your-user-id', 'your-tournament-id', 'tournament_invitation', 'Test', 'Test message');
