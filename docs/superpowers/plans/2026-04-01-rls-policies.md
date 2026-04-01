# RLS Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Row Level Security on all 8 database tables with appropriate access policies to protect customer PII and restrict writes to admin.

**Architecture:** Single SQL migration enables RLS and creates policies for each table. Policies use `auth.jwt()` for identity checks. No application code changes needed.

**Tech Stack:** PostgreSQL, Supabase RLS, SQL

---

## File Structure

- Create: `docs/migrations/2026-04-01-rls-policies.sql` - the migration file with all RLS policies

---

### Task 1: Write RLS migration for catalog tables

**Files:**
- Create: `docs/migrations/2026-04-01-rls-policies.sql`

- [ ] **Step 1: Create migration file with catalog table policies**

Create the migration file with RLS enabled and policies for the 5 catalog tables (`plants`, `plant_variants`, `plant_images`, `categories`, `shipping_config`). Each table gets the same two policies: public read, admin-only write.

```sql
-- ============================================
-- RLS Policies Migration
-- Enable Row Level Security on all tables
-- ============================================

-- ============================================
-- Catalog Tables: public read, admin-only write
-- Tables: plants, plant_variants, plant_images, categories, shipping_config
-- ============================================

-- plants
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON plants;
CREATE POLICY "public_read" ON plants FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_insert" ON plants;
CREATE POLICY "admin_insert" ON plants FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_update" ON plants;
CREATE POLICY "admin_update" ON plants FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_delete" ON plants;
CREATE POLICY "admin_delete" ON plants FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- plant_variants
ALTER TABLE plant_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON plant_variants;
CREATE POLICY "public_read" ON plant_variants FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_insert" ON plant_variants;
CREATE POLICY "admin_insert" ON plant_variants FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_update" ON plant_variants;
CREATE POLICY "admin_update" ON plant_variants FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_delete" ON plant_variants;
CREATE POLICY "admin_delete" ON plant_variants FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- plant_images
ALTER TABLE plant_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON plant_images;
CREATE POLICY "public_read" ON plant_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_insert" ON plant_images;
CREATE POLICY "admin_insert" ON plant_images FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_update" ON plant_images;
CREATE POLICY "admin_update" ON plant_images FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_delete" ON plant_images;
CREATE POLICY "admin_delete" ON plant_images FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON categories;
CREATE POLICY "public_read" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_insert" ON categories;
CREATE POLICY "admin_insert" ON categories FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_update" ON categories;
CREATE POLICY "admin_update" ON categories FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_delete" ON categories;
CREATE POLICY "admin_delete" ON categories FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

-- shipping_config
ALTER TABLE shipping_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON shipping_config;
CREATE POLICY "public_read" ON shipping_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_insert" ON shipping_config;
CREATE POLICY "admin_insert" ON shipping_config FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_update" ON shipping_config;
CREATE POLICY "admin_update" ON shipping_config FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
DROP POLICY IF EXISTS "admin_delete" ON shipping_config;
CREATE POLICY "admin_delete" ON shipping_config FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
```

- [ ] **Step 2: Commit**

```bash
git add docs/migrations/2026-04-01-rls-policies.sql
git commit -m "add RLS migration for catalog tables"
```

---

### Task 2: Add RLS policies for customers table

**Files:**
- Modify: `docs/migrations/2026-04-01-rls-policies.sql`

- [ ] **Step 1: Append customers policies to migration file**

Add the following to the end of the migration file:

```sql
-- ============================================
-- Customers: own-data read, admin-only write
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_read" ON customers;
CREATE POLICY "own_read" ON customers FOR SELECT
  USING (
    email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'email' = 'ejumlauf@gmail.com'
  );

DROP POLICY IF EXISTS "admin_insert" ON customers;
CREATE POLICY "admin_insert" ON customers FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS "admin_update" ON customers;
CREATE POLICY "admin_update" ON customers FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS "admin_delete" ON customers;
CREATE POLICY "admin_delete" ON customers FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
```

- [ ] **Step 2: Commit**

```bash
git add docs/migrations/2026-04-01-rls-policies.sql
git commit -m "add RLS policies for customers table"
```

---

### Task 3: Add RLS policies for orders table

**Files:**
- Modify: `docs/migrations/2026-04-01-rls-policies.sql`

- [ ] **Step 1: Append orders policies to migration file**

Add the following to the end of the migration file:

```sql
-- ============================================
-- Orders: own-data read, authenticated insert, admin manage
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_read" ON orders;
CREATE POLICY "own_read" ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'email' = 'ejumlauf@gmail.com'
  );

DROP POLICY IF EXISTS "authenticated_insert" ON orders;
CREATE POLICY "authenticated_insert" ON orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_update" ON orders;
CREATE POLICY "admin_update" ON orders FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS "admin_delete" ON orders;
CREATE POLICY "admin_delete" ON orders FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
```

- [ ] **Step 2: Commit**

```bash
git add docs/migrations/2026-04-01-rls-policies.sql
git commit -m "add RLS policies for orders table"
```

---

### Task 4: Add RLS policies for order_details table

**Files:**
- Modify: `docs/migrations/2026-04-01-rls-policies.sql`

- [ ] **Step 1: Append order_details policies to migration file**

Add the following to the end of the migration file:

```sql
-- ============================================
-- Order Details: own-data read, authenticated insert, admin manage
-- ============================================

ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_read" ON order_details;
CREATE POLICY "own_read" ON order_details FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE email = auth.jwt() ->> 'email'
      )
    )
    OR auth.jwt() ->> 'email' = 'ejumlauf@gmail.com'
  );

DROP POLICY IF EXISTS "authenticated_insert" ON order_details;
CREATE POLICY "authenticated_insert" ON order_details FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_update" ON order_details;
CREATE POLICY "admin_update" ON order_details FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');

DROP POLICY IF EXISTS "admin_delete" ON order_details;
CREATE POLICY "admin_delete" ON order_details FOR DELETE
  USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com');
```

- [ ] **Step 2: Commit**

```bash
git add docs/migrations/2026-04-01-rls-policies.sql
git commit -m "add RLS policies for order_details table"
```

---

### Task 5: Run migration in Supabase and verify

- [ ] **Step 1: Run the migration**

Go to the Supabase dashboard SQL Editor and paste the full contents of `docs/migrations/2026-04-01-rls-policies.sql`. Run it.

- [ ] **Step 2: Verify RLS is enabled**

In the Supabase SQL Editor, run:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: all 8 tables show `rowsecurity = true`.

- [ ] **Step 3: Verify policies exist**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected: policies for all 8 tables as defined in the migration.

- [ ] **Step 4: Test storefront browsing (unauthenticated)**

Open the storefront in an incognito/private browser window (not logged in). Verify:
- Plant catalog loads and displays correctly
- Plant detail pages show variants and images
- No errors in the browser console

- [ ] **Step 5: Test admin panel (authenticated as admin)**

Log in as the admin user and verify:
- Admin dashboard loads
- Can view/create/edit/delete plants, variants, images
- Can view/manage orders and customers
- Shipping config page works

- [ ] **Step 6: Commit final verification note**

```bash
git add docs/migrations/2026-04-01-rls-policies.sql
git commit -m "verify RLS migration applied successfully"
```
