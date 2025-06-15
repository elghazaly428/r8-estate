/*
  # Add type column to notifications table

  1. Changes
    - Add `type` column to `notifications` table as TEXT with default value
    - The column will store notification types like 'review_deleted', 'reply_deleted', etc.
    
  2. Security
    - No changes to existing RLS policies needed
    - Column is optional and has a default value for backward compatibility
*/

-- Add the type column to notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'general';
  END IF;
END $$;