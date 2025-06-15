/*
  # Add search_companies function with ratings and review counts

  1. New Function
    - `search_companies(search_term text)` - Searches companies with aggregated rating data
    - Returns company info along with average rating and review count
    - Orders results by relevance (exact matches first, then by popularity)

  2. Security
    - Grant execute permissions to authenticated and anonymous users
    - Function uses SECURITY DEFINER for proper access control
*/

-- Drop existing function if it exists to avoid return type conflicts
DROP FUNCTION IF EXISTS search_companies(text);

-- Create search_companies function with enhanced return data
CREATE OR REPLACE FUNCTION search_companies(search_term text)
RETURNS TABLE (
  id bigint,
  name text,
  logo_url text,
  website text,
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
    COALESCE(ROUND(AVG(r.overall_rating), 1), 0) as avg_rating,
    COUNT(r.id) as review_count
  FROM companies c
  LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
  WHERE c.name ILIKE '%' || search_term || '%'
  GROUP BY c.id, c.name, c.logo_url, c.website
  ORDER BY 
    -- Prioritize exact matches
    CASE WHEN LOWER(c.name) = LOWER(search_term) THEN 1 ELSE 2 END,
    -- Then by review count (more reviews = higher priority)
    COUNT(r.id) DESC,
    -- Finally by average rating
    AVG(r.overall_rating) DESC NULLS LAST
  LIMIT 5;
END;
$$;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION search_companies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_companies(text) TO anon;