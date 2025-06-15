/*
  # Create notifications table and functionality

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `recipient_profile_id` (uuid, foreign key to profiles)
      - `type` (text) - Type of notification (reply, vote, review, etc.)
      - `message` (text) - Notification message content
      - `link_url` (text) - URL to navigate when clicked
      - `is_read` (boolean) - Read status
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on notifications table
    - Add policies for users to manage their own notifications

  3. Indexes
    - Add indexes for efficient querying by recipient and read status
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  link_url text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_profile_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_profile_id)
  WITH CHECK (auth.uid() = recipient_profile_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_profile_id ON notifications(recipient_profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_profile_id, is_read) WHERE is_read = false;

-- Insert sample notifications for testing (these will be replaced by real notifications)
-- Note: These are just examples and won't work without real user IDs
-- INSERT INTO notifications (recipient_profile_id, type, message, link_url, is_read) VALUES
-- ('sample-user-id', 'reply', 'شركة العقارات المتميزة ردت على تقييمك', '/company/1', false),
-- ('sample-user-id', 'vote', 'أحد المستخدمين وجد تقييمك مفيداً', '/company/1', false);