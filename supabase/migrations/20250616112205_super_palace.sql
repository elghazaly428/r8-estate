/*
  # Create filter_companies function for comprehensive search and filtering

  1. New Function
    - `filter_companies(search_term, min_rating, filter_category_id)` - Comprehensive company filtering
    - Handles text search, minimum rating filtering, and category filtering
    - Returns enriched company data with ratings and review counts
    - Supports null values for optional filters

  2. Security
    - Grant execute permissions to authenticated and anonymous users
    - Function uses SECURITY DEFINER for proper access control

  3. Performance
    - Optimized query with proper JOINs and aggregations
    - Efficient filtering logic with null handling
    - Proper ordering by relevance and quality metrics
*/

-- Create comprehensive filter_companies function
CREATE OR REPLACE FUNCTION filter_companies(
  search_term text DEFAULT NULL,
  min_rating numeric DEFAULT NULL,
  filter_category_id bigint DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  name text,
  logo_url text,
  website text,
  location text,
  category_id bigint,
  description text,
  established_in integer,
  created_at timestamptz,
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
    c.category_id,
    c.description,
    c.established_in,
    c.created_at,
    COALESCE(CAST(ROUND(CAST(AVG(r.overall_rating) AS numeric), 1) AS numeric), 0) as avg_rating,
    COUNT(r.id) as review_count
  FROM companies c
  LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
  WHERE 
    -- Text search filter (optional)
    (search_term IS NULL OR c.name ILIKE '%' || search_term || '%')
    AND
    -- Category filter (optional)
    (filter_category_id IS NULL OR c.category_id = filter_category_id)
  GROUP BY c.id, c.name, c.logo_url, c.website, c.location, c.category_id, c.description, c.established_in, c.created_at
  HAVING
    -- Rating filter (optional) - applied after aggregation
    (min_rating IS NULL OR COALESCE(AVG(r.overall_rating), 0) >= min_rating)
  ORDER BY 
    -- Prioritize exact matches for text search
    CASE 
      WHEN search_term IS NOT NULL AND LOWER(c.name) = LOWER(search_term) THEN 1 
      ELSE 2 
    END,
    -- Then by review count (more reviews = higher priority)
    COUNT(r.id) DESC,
    -- Finally by average rating
    AVG(r.overall_rating) DESC NULLS LAST,
    -- Fallback to creation date
    c.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION filter_companies(text, numeric, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION filter_companies(text, numeric, bigint) TO anon;