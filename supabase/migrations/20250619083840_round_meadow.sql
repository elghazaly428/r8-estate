/*
  # Create admin dashboard functions

  1. New Functions
    - `get_reviews_with_replies` - Gets reviews with their associated company replies for admin dashboard
    - `get_company_reply_by_review_id` - Gets company reply for a specific review
  
  2. Security
    - Functions are accessible to authenticated users (admin check should be done in application layer)
  
  3. Purpose
    - Resolves the "Failed to fetch" error in AdminDashboard when checking company replies
    - Provides efficient data retrieval for admin review management
*/

-- Function to get company reply for a specific review
CREATE OR REPLACE FUNCTION get_company_reply_by_review_id(review_id_param bigint)
RETURNS TABLE (
  id bigint,
  created_at timestamptz,
  reply_body text,
  review_id bigint,
  profile_id uuid,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.created_at,
    cr.reply_body,
    cr.review_id,
    cr.profile_id,
    cr.status
  FROM company_replies cr
  WHERE cr.review_id = review_id_param
  AND cr.status = 'published'
  LIMIT 1;
END;
$$;

-- Function to get reviews with their replies for admin dashboard
CREATE OR REPLACE FUNCTION get_reviews_with_replies(
  limit_param integer DEFAULT 50,
  offset_param integer DEFAULT 0
)
RETURNS TABLE (
  review_id bigint,
  review_created_at timestamptz,
  review_title text,
  review_body text,
  review_rating numeric,
  review_status text,
  company_id bigint,
  company_name text,
  profile_id uuid,
  reviewer_name text,
  reply_id bigint,
  reply_body text,
  reply_created_at timestamptz,
  reply_status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as review_id,
    r.created_at as review_created_at,
    r.title as review_title,
    r.body as review_body,
    r.overall_rating as review_rating,
    r.status::text as review_status,
    r.company_id,
    c.name as company_name,
    r.profile_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Anonymous') as reviewer_name,
    cr.id as reply_id,
    cr.reply_body,
    cr.created_at as reply_created_at,
    cr.status as reply_status
  FROM reviews r
  LEFT JOIN companies c ON r.company_id = c.id
  LEFT JOIN profiles p ON r.profile_id = p.id
  LEFT JOIN company_replies cr ON r.id = cr.review_id AND cr.status = 'published'
  WHERE r.status = 'published'
  ORDER BY r.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_company_reply_by_review_id(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviews_with_replies(integer, integer) TO authenticated;