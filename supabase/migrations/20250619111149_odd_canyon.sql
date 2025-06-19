/*
  # Add flagged_for_review to review_status enum

  1. Changes
    - Add 'flagged_for_review' as a valid value to the review_status enum type
    - This will allow the handle_new_review_report RPC function to set reviews to flagged_for_review status

  2. Security
    - No RLS changes needed as this only modifies the enum type
*/

-- Add the new enum value to review_status
ALTER TYPE review_status ADD VALUE IF NOT EXISTS 'flagged_for_review';