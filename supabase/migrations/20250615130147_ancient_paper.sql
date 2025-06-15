/*
  # Create get_featured_companies function

  1. New Function
    - `get_featured_companies()` - Returns up to 6 featured companies with ratings and review counts
    - Includes company info, category name, average rating, and review count
    - Orders by review count and rating for best companies first

  2. Security
    - Grant execute permissions to authenticated and anonymous users
    - Function uses SECURITY DEFINER for proper access control
*/

-- Create get_featured_companies function
CREATE OR REPLACE FUNCTION get_featured_companies()
RETURNS TABLE (
  id bigint,
  name text,
  logo_url text,
  website text,
  location text,
  category_name text,
  avg_rating numeric,
  review_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.logo_url,
    c.website,
    c.location,
    cat.name as category_name,
    COALESCE(CAST(ROUND(CAST(AVG(r.overall_rating) AS numeric), 1) AS numeric), 0) as avg_rating,
    COUNT(r.id) as review_count
  FROM companies c
  LEFT JOIN categories cat ON c.category_id = cat.id
  LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
  WHERE c.name IS NOT NULL
  GROUP BY c.id, c.name, c.logo_url, c.website, c.location, cat.name
  ORDER BY 
    -- Prioritize companies with more reviews
    COUNT(r.id) DESC,
    -- Then by average rating
    AVG(r.overall_rating) DESC NULLS LAST,
    -- Finally by creation date (newer first)
    c.created_at DESC
  LIMIT 6;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_featured_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION get_featured_companies() TO anon;