/*
  # Add verification_tag column to reviews table

  1. New Columns
    - `verification_tag` (text) - Admin-assigned verification status for reviews
    - Possible values: 'Verified True', 'Verified not True', 'Not Verified', or NULL

  2. Changes
    - Add verification_tag column to reviews table
    - Column is nullable to allow reviews without tags
    - No default value to distinguish between untagged and tagged reviews
*/

-- Add verification_tag column to reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'verification_tag'
  ) THEN
    ALTER TABLE reviews ADD COLUMN verification_tag text;
  END IF;
END $$;

-- Add check constraint for valid verification tag values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reviews_verification_tag_check'
  ) THEN
    ALTER TABLE reviews ADD CONSTRAINT reviews_verification_tag_check 
    CHECK (verification_tag IN ('Verified True', 'Verified not True', 'Not Verified') OR verification_tag IS NULL);
  END IF;
END $$;

-- Create index for efficient querying by verification tag
CREATE INDEX IF NOT EXISTS idx_reviews_verification_tag ON reviews(verification_tag);