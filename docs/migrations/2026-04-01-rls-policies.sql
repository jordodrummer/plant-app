-- RLS Policies Migration
-- Date: 2026-04-01
-- Description: Enable Row Level Security on all tables and add policies.
--   Public users can read catalog data. Only the admin can modify catalog data.
--   Customers, orders, and order details are readable by the owning customer or admin.
--
-- Run this manually in the Supabase SQL Editor.
-- All policies use DROP ... IF EXISTS before CREATE for idempotency.

-- ============================================================
-- Section 1: Catalog Tables
-- Tables: plants, plant_variants, plant_images, categories, shipping_config
-- Policy rules:
--   public_read    -- anyone can SELECT
--   admin_insert   -- only admin can INSERT
--   admin_update   -- only admin can UPDATE
--   admin_delete   -- only admin can DELETE
-- ============================================================

-- ------------------------------------------------------------
-- plants
-- ------------------------------------------------------------
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read ON plants;
CREATE POLICY public_read ON plants
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS admin_insert ON plants;
CREATE POLICY admin_insert ON plants
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_update ON plants;
CREATE POLICY admin_update ON plants
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_delete ON plants;
CREATE POLICY admin_delete ON plants
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- ------------------------------------------------------------
-- plant_variants
-- ------------------------------------------------------------
ALTER TABLE plant_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read ON plant_variants;
CREATE POLICY public_read ON plant_variants
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS admin_insert ON plant_variants;
CREATE POLICY admin_insert ON plant_variants
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_update ON plant_variants;
CREATE POLICY admin_update ON plant_variants
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_delete ON plant_variants;
CREATE POLICY admin_delete ON plant_variants
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- ------------------------------------------------------------
-- plant_images
-- ------------------------------------------------------------
ALTER TABLE plant_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read ON plant_images;
CREATE POLICY public_read ON plant_images
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS admin_insert ON plant_images;
CREATE POLICY admin_insert ON plant_images
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_update ON plant_images;
CREATE POLICY admin_update ON plant_images
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_delete ON plant_images;
CREATE POLICY admin_delete ON plant_images
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- ------------------------------------------------------------
-- categories
-- ------------------------------------------------------------
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read ON categories;
CREATE POLICY public_read ON categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS admin_insert ON categories;
CREATE POLICY admin_insert ON categories
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_update ON categories;
CREATE POLICY admin_update ON categories
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_delete ON categories;
CREATE POLICY admin_delete ON categories
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- ------------------------------------------------------------
-- shipping_config
-- ------------------------------------------------------------
ALTER TABLE shipping_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read ON shipping_config;
CREATE POLICY public_read ON shipping_config
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS admin_insert ON shipping_config;
CREATE POLICY admin_insert ON shipping_config
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_update ON shipping_config;
CREATE POLICY admin_update ON shipping_config
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS admin_delete ON shipping_config;
CREATE POLICY admin_delete ON shipping_config
  FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
