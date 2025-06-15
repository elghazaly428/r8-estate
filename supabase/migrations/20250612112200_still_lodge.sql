/*
  # Add reporting functions and status columns

  1. New Columns
    - Add status column to reviews table (if not exists)
    - Add status column to company_replies table (if not exists)

  2. New Functions
    - handle_new_review_report: Processes review reports and auto-flags content
    - handle_new_reply_report: Processes reply reports and auto-flags content

  3. Security
    - Functions use SECURITY DEFINER for proper access control
    - Grant execute permissions to authenticated users
*/

-- Add status column to reviews if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE reviews ADD COLUMN status review_status DEFAULT 'published';
  END IF;
END $$;

-- Add status column to company_replies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_replies' AND column_name = 'status'
  ) THEN
    ALTER TABLE company_replies ADD COLUMN status text DEFAULT 'published';
  END IF;
END $$;

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS handle_new_review_report(bigint, uuid, text, text);
DROP FUNCTION IF EXISTS handle_new_reply_report(bigint, uuid, text, text);

-- Create function to handle new review reports
CREATE OR REPLACE FUNCTION handle_new_review_report(
  p_review_id bigint,
  p_reporter_profile_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id bigint;
  v_report_count integer;
  v_current_status review_status;
BEGIN
  -- Check if user already reported this review
  IF EXISTS (
    SELECT 1 FROM reports 
    WHERE review_id = p_review_id 
    AND reporter_profile_id = p_reporter_profile_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already reported this review'
    );
  END IF;

  -- Insert the report
  INSERT INTO reports (
    review_id,
    reporter_profile_id,
    reason,
    details,
    status
  ) VALUES (
    p_review_id,
    p_reporter_profile_id,
    p_reason,
    p_details,
    'pending'
  ) RETURNING id INTO v_report_id;

  -- Count total reports for this review
  SELECT COUNT(*) INTO v_report_count
  FROM reports
  WHERE review_id = p_review_id
  AND status = 'pending';

  -- Get current review status
  SELECT status INTO v_current_status
  FROM reviews
  WHERE id = p_review_id;

  -- Flag for review if we have 3 or more reports and not already flagged
  IF v_report_count >= 3 AND v_current_status != 'flagged_for_review'::review_status THEN
    UPDATE reviews
    SET status = 'flagged_for_review'::review_status
    WHERE id = p_review_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'report_id', v_report_id,
    'total_reports', v_report_count,
    'flagged', v_report_count >= 3
  );
END;
$$;

-- Create function to handle new reply reports
CREATE OR REPLACE FUNCTION handle_new_reply_report(
  p_reply_id bigint,
  p_reporter_profile_id uuid,
  p_reason text,
  p_details text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id bigint;
  v_report_count integer;
  v_current_status text;
BEGIN
  -- Check if user already reported this reply
  IF EXISTS (
    SELECT 1 FROM reply_reports 
    WHERE reply_id = p_reply_id 
    AND reporter_profile_id = p_reporter_profile_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already reported this reply'
    );
  END IF;

  -- Insert the report
  INSERT INTO reply_reports (
    reply_id,
    reporter_profile_id,
    reason,
    details,
    status
  ) VALUES (
    p_reply_id,
    p_reporter_profile_id,
    p_reason,
    p_details,
    'pending'
  ) RETURNING id INTO v_report_id;

  -- Count total reports for this reply
  SELECT COUNT(*) INTO v_report_count
  FROM reply_reports
  WHERE reply_id = p_reply_id
  AND status = 'pending';

  -- Get current reply status
  SELECT status INTO v_current_status
  FROM company_replies
  WHERE id = p_reply_id;

  -- Flag for review if we have 3 or more reports and not already flagged
  IF v_report_count >= 3 AND v_current_status != 'flagged_for_review' THEN
    UPDATE company_replies
    SET status = 'flagged_for_review'
    WHERE id = p_reply_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'report_id', v_report_id,
    'total_reports', v_report_count,
    'flagged', v_report_count >= 3
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_new_review_report(bigint, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_reply_report(bigint, uuid, text, text) TO authenticated;