/*
  # Add company representatives and enhance company replies

  1. New Tables
    - `company_representatives`
      - `id` (uuid, primary key)
      - `company_id` (bigint, foreign key to companies)
      - `profile_id` (uuid, foreign key to profiles)
      - `role` (text, default 'representative')
      - `verified_at` (timestamp)
      - `created_at` (timestamp)

  2. Enhanced Tables
    - Update `company_replies` to use uuid primary key for consistency
    - Add indexes for better performance

  3. Security
    - Enable RLS on company_representatives table
    - Add policies for representatives to manage their company data
*/

-- Create company_representatives table
CREATE TABLE IF NOT EXISTS company_representatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id bigint NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'representative',
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, profile_id)
);

-- Update company_replies to use uuid primary key if needed
DO $$
BEGIN
  -- Check if company_replies.id is not uuid type and update if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'company_replies' 
    AND column_name = 'id' 
    AND data_type = 'bigint'
  ) THEN
    -- Drop and recreate with uuid
    ALTER TABLE company_replies DROP CONSTRAINT company_replies_pkey;
    ALTER TABLE company_replies DROP COLUMN id;
    ALTER TABLE company_replies ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Enable RLS on company_representatives
ALTER TABLE company_representatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_representatives
CREATE POLICY "Representatives can view their own company assignments"
  ON company_representatives
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Company representatives can view company data"
  ON company_representatives
  FOR SELECT
  TO authenticated
  USING (true);

-- Enhanced RLS Policies for company_replies
DROP POLICY IF EXISTS "Company representatives can insert replies" ON company_replies;
DROP POLICY IF EXISTS "Company representatives can view replies" ON company_replies;

CREATE POLICY "Company representatives can insert replies"
  ON company_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_representatives cr
      JOIN reviews r ON r.company_id = cr.company_id
      WHERE cr.profile_id = auth.uid()
      AND r.id = review_id
    )
  );

CREATE POLICY "Anyone can view company replies"
  ON company_replies
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_representatives_company_id ON company_representatives(company_id);
CREATE INDEX IF NOT EXISTS idx_company_representatives_profile_id ON company_representatives(profile_id);