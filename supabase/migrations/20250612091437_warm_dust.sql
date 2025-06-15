/*
  # Add sample companies and setup for company representatives

  1. New Data
    - Insert sample companies if they don't already exist
    - Create structure for company representatives (manual linking required)

  2. Changes
    - Add sample companies to demonstrate the system
    - Companies are marked as claimed to show verified status
    - Representatives will need to be added manually with actual user UUIDs

  3. Notes
    - This migration creates sample data for testing
    - Actual company representatives need real user profiles
    - Use the application interface to link users to companies
*/

-- Insert sample companies (using INSERT with subquery to avoid conflicts)
INSERT INTO companies (name, logo_url, website, is_claimed, description, location)
SELECT 'شركة العقارات المتميزة', null, 'https://example.com', true, 'شركة رائدة في مجال العقارات', 'القاهرة، مصر'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'شركة العقارات المتميزة');

INSERT INTO companies (name, logo_url, website, is_claimed, description, location)
SELECT 'مجموعة الإسكان الحديث', null, 'https://modern-housing.com', true, 'متخصصون في الإسكان الحديث', 'الجيزة، مصر'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'مجموعة الإسكان الحديث');

INSERT INTO companies (name, logo_url, website, is_claimed, description, location)
SELECT 'شركة التطوير العقاري الذكي', null, 'https://smart-dev.com', true, 'تطوير عقاري بتقنيات حديثة', 'الإسكندرية، مصر'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'شركة التطوير العقاري الذكي');

INSERT INTO companies (name, logo_url, website, is_claimed, description, location)
SELECT 'مؤسسة الاستثمار العقاري', null, 'https://real-estate-investment.com', true, 'استشارات استثمارية عقارية متخصصة', 'القاهرة الجديدة، مصر'
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE name = 'مؤسسة الاستثمار العقاري');

-- Add some categories if they don't exist
INSERT INTO categories (name, description)
SELECT 'خدمات الاستشارات العقارية', 'شركات متخصصة في تقديم الاستشارات العقارية'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'خدمات الاستشارات العقارية');

INSERT INTO categories (name, description)
SELECT 'التطوير العقاري', 'شركات تطوير وبناء المشاريع العقارية'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'التطوير العقاري');

INSERT INTO categories (name, description)
SELECT 'إدارة الممتلكات', 'شركات إدارة وصيانة العقارات'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'إدارة الممتلكات');

INSERT INTO categories (name, description)
SELECT 'الوساطة العقارية', 'شركات وساطة في بيع وشراء العقارات'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'الوساطة العقارية');

-- Update companies to link them with categories
UPDATE companies 
SET category_id = (SELECT id FROM categories WHERE name = 'خدمات الاستشارات العقارية' LIMIT 1)
WHERE name = 'شركة العقارات المتميزة' AND category_id IS NULL;

UPDATE companies 
SET category_id = (SELECT id FROM categories WHERE name = 'التطوير العقاري' LIMIT 1)
WHERE name = 'مجموعة الإسكان الحديث' AND category_id IS NULL;

UPDATE companies 
SET category_id = (SELECT id FROM categories WHERE name = 'التطوير العقاري' LIMIT 1)
WHERE name = 'شركة التطوير العقاري الذكي' AND category_id IS NULL;

UPDATE companies 
SET category_id = (SELECT id FROM categories WHERE name = 'خدمات الاستشارات العقارية' LIMIT 1)
WHERE name = 'مؤسسة الاستثمار العقاري' AND category_id IS NULL;

-- Note: To create company representatives, you need to:
-- 1. Have users sign up and create profiles
-- 2. Use the application to link those users to companies as representatives
-- 
-- Example SQL for when you have actual user UUIDs:
-- INSERT INTO company_representatives (company_id, profile_id, role) VALUES
-- ((SELECT id FROM companies WHERE name = 'شركة العقارات المتميزة'), 'actual-user-uuid-here', 'representative');
--
-- This can be done through the application interface or manually with real user IDs