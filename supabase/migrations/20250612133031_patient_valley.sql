/*
  # Update existing categories table with comprehensive real estate categories

  1. New Columns
    - Add `icon_name` column to categories table if it doesn't exist

  2. Category Updates
    - Update existing categories with appropriate icons
    - Add new comprehensive real estate categories
    - Preserve existing foreign key relationships

  3. Icon Names
    - All icon names correspond to Lucide React icons
    - Icons chosen to best represent each category
    - Fallback system handles variations in naming
*/

-- First, add icon_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'icon_name'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon_name text;
  END IF;
END $$;

-- Update existing categories with appropriate icons
UPDATE categories SET 
  icon_name = 'briefcase',
  description = 'شركات متخصصة في تقديم الاستشارات العقارية'
WHERE name = 'خدمات الاستشارات العقارية';

UPDATE categories SET 
  icon_name = 'building2',
  description = 'شركات تطوير وبناء المشاريع العقارية'
WHERE name = 'التطوير العقاري';

UPDATE categories SET 
  icon_name = 'home',
  description = 'شركات إدارة وصيانة العقارات'
WHERE name = 'إدارة الممتلكات';

UPDATE categories SET 
  icon_name = 'users',
  description = 'شركات وساطة في بيع وشراء العقارات'
WHERE name = 'الوساطة العقارية';

-- Insert new comprehensive real estate categories (only if they don't exist)
INSERT INTO categories (name, description, icon_name) 
SELECT * FROM (VALUES
  -- Core Real Estate Services
  ('التمويل العقاري', 'شركات ومؤسسات التمويل والقروض العقارية', 'calculator'),
  ('التقييم العقاري', 'شركات التقييم العقاري والاستشارات المالية', 'target'),
  ('الاستثمار العقاري', 'شركات الاستثمار والصناديق العقارية', 'trending-up'),
  
  -- Construction & Development
  ('المقاولات العامة', 'شركات المقاولات العامة والإنشاءات', 'hammer'),
  ('التصميم المعماري', 'مكاتب التصميم المعماري والهندسي', 'ruler'),
  ('الهندسة الإنشائية', 'شركات الهندسة الإنشائية والاستشارات الهندسية', 'settings'),
  ('المقاولات المتخصصة', 'مقاولات التشطيبات والأعمال المتخصصة', 'wrench'),
  ('مواد البناء', 'شركات توريد مواد البناء والإنشاء', 'package'),
  
  -- Legal & Financial Services
  ('الخدمات القانونية', 'مكاتب المحاماة والاستشارات القانونية العقارية', 'scale'),
  ('التأمين العقاري', 'شركات التأمين على العقارات والممتلكات', 'shield'),
  ('الخدمات المصرفية', 'البنوك والمؤسسات المالية العقارية', 'piggy-bank'),
  
  -- Technology & Innovation
  ('التكنولوجيا العقارية', 'شركات التكنولوجيا والحلول الرقمية العقارية', 'smartphone'),
  ('التسويق الرقمي', 'شركات التسويق الرقمي والإعلان العقاري', 'globe'),
  ('المنصات الإلكترونية', 'منصات البيع والشراء الإلكترونية', 'monitor'),
  ('التصوير العقاري', 'شركات التصوير الفوتوغرافي والافتراضي للعقارات', 'camera'),
  
  -- Specialized Services
  ('النقل والانتقال', 'شركات النقل وخدمات الانتقال', 'truck'),
  ('الأمن والحراسة', 'شركات الأمن وحراسة العقارات', 'shield'),
  ('التنظيف والصيانة', 'شركات التنظيف والصيانة العامة', 'wrench'),
  ('تنسيق الحدائق', 'شركات تنسيق الحدائق والمساحات الخضراء', 'tree'),
  ('التكييف والكهرباء', 'شركات التكييف والأعمال الكهربائية', 'zap'),
  
  -- Analysis & Research
  ('التحليل العقاري', 'شركات التحليل والبحوث العقارية', 'bar-chart-3'),
  ('إدارة المحافظ', 'شركات إدارة المحافظ العقارية', 'pie-chart'),
  ('الاستشارات الاستثمارية', 'مستشارو الاستثمار العقاري', 'line-chart'),
  
  -- Hospitality & Tourism
  ('الضيافة والفنادق', 'شركات إدارة الفنادق والمنتجعات', 'building'),
  ('السياحة العقارية', 'شركات السياحة والاستثمار العقاري السياحي', 'map-pin'),
  
  -- International Services
  ('العقارات الدولية', 'شركات العقارات والاستثمار الدولي', 'globe'),
  ('الهجرة والاستثمار', 'شركات الهجرة والاستثمار العقاري الخارجي', 'plane'),
  
  -- Additional Specialized Services
  ('الديكور والتصميم الداخلي', 'شركات الديكور والتصميم الداخلي', 'palette'),
  ('الطاقة المتجددة', 'شركات الطاقة الشمسية والحلول البيئية', 'sun'),
  ('الذكاء الاصطناعي العقاري', 'شركات الذكاء الاصطناعي والتحليل المتقدم', 'cpu'),
  ('إدارة المشاريع', 'شركات إدارة المشاريع العقارية', 'clipboard'),
  ('الخدمات اللوجستية', 'شركات الخدمات اللوجستية والتوريد', 'truck'),
  ('التدريب والتطوير', 'مراكز التدريب والتطوير المهني العقاري', 'book'),
  ('البحث والتطوير', 'مراكز البحث والتطوير في القطاع العقاري', 'search'),
  ('الاستشارات البيئية', 'شركات الاستشارات البيئية والاستدامة', 'leaf')
) AS new_categories(name, description, icon_name)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE categories.name = new_categories.name
);