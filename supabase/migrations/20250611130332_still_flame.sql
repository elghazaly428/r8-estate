/*
  # Add RLS policy for profiles table

  1. Security Changes
    - Add policy to allow authenticated users to insert their own profile data
    - This enables user registration by allowing users to create their profile after sign-up
    - Policy ensures users can only insert data with their own user ID (auth.uid())

  2. Policy Details
    - Table: `profiles`
    - Operation: INSERT
    - Target: authenticated users
    - Condition: The profile ID must match the authenticated user's ID
*/

-- Create policy to allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);