-- Add special to variant_type CHECK constraint
ALTER TABLE plant_variants DROP CONSTRAINT IF EXISTS plant_variants_variant_type_check;
ALTER TABLE plant_variants ADD CONSTRAINT plant_variants_variant_type_check
  CHECK (variant_type IN ('cutting', 'rooted_cutting', 'cut_to_order', 'mother_stand', 'seedling', 'op_seeds', 'hybrid_seeds', 'special'));

-- Add weight and shipping override columns to plant_variants
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS weight_lbs INTEGER DEFAULT 0;
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS weight_oz INTEGER DEFAULT 0;
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS shipping_override INTEGER;

-- Create shipping_config table
CREATE TABLE IF NOT EXISTS shipping_config (
  id SERIAL PRIMARY KEY,
  variant_type VARCHAR(20) UNIQUE NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('flat', 'realtime')),
  base_price INTEGER,
  additional_price INTEGER
);

-- Seed default shipping config
INSERT INTO shipping_config (variant_type, method, base_price, additional_price) VALUES
  ('cutting', 'flat', 600, 150),
  ('rooted_cutting', 'realtime', NULL, NULL),
  ('cut_to_order', 'realtime', NULL, NULL),
  ('mother_stand', 'realtime', NULL, NULL),
  ('seedling', 'realtime', NULL, NULL),
  ('op_seeds', 'flat', 400, 100),
  ('hybrid_seeds', 'flat', 400, 100),
  ('special', 'realtime', NULL, NULL)
ON CONFLICT (variant_type) DO NOTHING;
