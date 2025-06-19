/*
  # Fix review_status enum error

  1. Problem
    - The review_status enum is causing errors when the value "removed" is encountered
    - This suggests either the enum is missing the value or there's data inconsistency

  2. Solution
    - Ensure the review_status enum has all required values
    - Update any invalid status values in the reviews table
    - Add the missing enum value if needed

  3. Security
    - No RLS changes needed for this fix
*/

-- First, let's check if 'removed' exists in the enum, if not add it
DO $$
BEGIN
  -- Try to add 'removed' to the enum if it doesn't exist
  BEGIN
    ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'removed';
  EXCEPTION
    WHEN duplicate_object THEN
      -- Value already exists, do nothing
      NULL;
  END;
END $$;

-- Update any reviews that might have invalid status values
-- Set any NULL or invalid status values to 'published' (the default)
UPDATE reviews 
SET status = 'published'::review_status 
WHERE status IS NULL;

-- Ensure the default value is properly set for the status column
ALTER TABLE reviews 
ALTER COLUMN status SET DEFAULT 'published'::review_status;