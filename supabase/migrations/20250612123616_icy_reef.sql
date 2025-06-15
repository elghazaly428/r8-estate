/*
  # Create search_companies function with ratings and review counts

  1. New Functions
    - `search_companies`: Searches companies by name and returns enriched data
      - Returns company basic info (id, name, logo_url, website)
      - Calculates average rating from published reviews
      - Counts total published reviews
      - Orders results by relevance (exact matches first, then by review count and rating)

  2. Security
    - Function uses SECURITY DEFINER for proper access control
    - Grants execute permissions to authenticated and anonymous users
    - Only includes published reviews in calculations

  3. Performance
    - Uses LEFT JOIN to include companies without reviews
    - Limits results to 5 companies for optimal performance
    - Proper indexing on company names and review status recommended
*/

-- Drop existing function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS search_companies(text);

-- Create search_companies function
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
    COALESCE(CAST(ROUND(CAST(AVG(r.overall_rating) AS numeric), 1) AS numeric), 0) as avg_rating,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_companies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_companies(text) TO anon;