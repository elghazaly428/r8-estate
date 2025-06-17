/*
  # Add vote types to voting tables

  1. Schema Changes
    - Add vote_type column to review_votes table
    - Add vote_type column to reply_votes table
    - Update existing votes to have 'helpful' as default type
    - Add check constraints for vote_type values

  2. Security
    - Maintain existing RLS policies
    - Ensure vote_type is properly validated
*/

-- Add vote_type column to review_votes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'review_votes' AND column_name = 'vote_type'
  ) THEN
    ALTER TABLE review_votes ADD COLUMN vote_type text DEFAULT 'helpful' NOT NULL;
    
    -- Add check constraint for valid vote types
    ALTER TABLE review_votes ADD CONSTRAINT review_votes_vote_type_check 
    CHECK (vote_type IN ('helpful', 'not_helpful'));
  END IF;
END $$;

-- Add vote_type column to reply_votes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reply_votes' AND column_name = 'vote_type'
  ) THEN
    ALTER TABLE reply_votes ADD COLUMN vote_type text DEFAULT 'helpful' NOT NULL;
    
    -- Add check constraint for valid vote types
    ALTER TABLE reply_votes ADD CONSTRAINT reply_votes_vote_type_check 
    CHECK (vote_type IN ('helpful', 'not_helpful'));
  END IF;
END $$;

-- Update existing votes to have 'helpful' type (they were all positive votes before)
UPDATE review_votes SET vote_type = 'helpful' WHERE vote_type IS NULL;
UPDATE reply_votes SET vote_type = 'helpful' WHERE vote_type IS NULL;