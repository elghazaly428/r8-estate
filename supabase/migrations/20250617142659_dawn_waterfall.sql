/*
  # Add email column to profiles table

  1. New Columns
    - `email` (text) - User's email address for easier searching and management

  2. Changes
    - Add email column to profiles table
    - Create index for efficient email searching
    - Update existing profiles with email from auth.users (if possible)

  3. Security
    - Email column will be populated during user registration
    - Allows admin search by email without accessing auth.users directly
*/

-- Add email column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;
END $$;

-- Create index for email searching
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create index for email pattern searching (for ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_profiles_email_pattern ON profiles(lower(email));