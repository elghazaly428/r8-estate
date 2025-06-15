/*
  # Add admin and suspension fields to profiles table

  1. New Columns
    - `is_admin` (boolean) - Marks users as administrators
    - `is_suspended` (boolean) - Marks users as suspended

  2. Changes
    - Add admin flag for superuser access control
    - Add suspension flag for user moderation
    - Both default to false for security
*/

-- Add is_admin column for admin access control
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Add is_suspended column for user moderation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;
END $$;

-- Update reports table to use proper enum if not already done
DO $$
BEGIN
  -- Update reports status column to use proper values
  UPDATE reports SET status = 'pending' WHERE status = 'received';
EXCEPTION
  WHEN OTHERS THEN
    -- Column might not exist or other error, continue
    NULL;
END $$;