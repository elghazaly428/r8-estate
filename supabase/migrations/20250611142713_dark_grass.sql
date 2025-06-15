/*
  # Create review votes and reports tables

  1. New Tables
    - `review_votes`
      - `id` (uuid, primary key)
      - `review_id` (bigint, foreign key to reviews)
      - `profile_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
    - `reports`
      - `id` (uuid, primary key)
      - `review_id` (bigint, foreign key to reviews)
      - `reporter_profile_id` (uuid, foreign key to profiles)
      - `reason` (text)
      - `details` (text, optional)
      - `status` (enum: pending, reviewed, resolved)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own votes and reports
    - Add unique constraint on review_votes to prevent duplicate votes

  3. Indexes
    - Add indexes for efficient querying
*/

-- Create review_votes table
CREATE TABLE IF NOT EXISTS review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, profile_id)
);

-- Create reports status enum
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status report_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_votes
CREATE POLICY "Users can view all review votes"
  ON review_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON review_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own votes"
  ON review_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_profile_id);

CREATE POLICY "Users can insert their own reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_profile_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_profile_id ON review_votes(profile_id);
CREATE INDEX IF NOT EXISTS idx_reports_review_id ON reports(review_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_profile_id ON reports(reporter_profile_id);