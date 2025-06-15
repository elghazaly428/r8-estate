/*
  # Setup avatar storage bucket and policies

  1. Storage Setup
    - Create avatars bucket for user profile pictures
    - Configure bucket as public with file size and type restrictions
    - Set up proper RLS policies for user avatar management

  2. Security
    - Users can only upload/update/delete their own avatars
    - Public read access for displaying avatars
    - Files organized by user ID folders for security
*/

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Create storage policies using the storage schema
-- Note: We need to use the storage.policies approach for Supabase

-- Policy: Allow authenticated users to upload their own avatars
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view all avatars" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create policies for avatar management
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view all avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');