# Row Level Security (RLS) Policies Design

## Problem

All 8 database tables have no RLS policies. The Supabase anon key is exposed client-side, meaning anyone with the key can query tables directly via the Supabase REST API, bypassing application-level auth checks. Customer PII (names, emails, addresses) and order data are exposed.

## Approach

Enable RLS on all tables with policies enforced at the database level. No code changes needed. The anon key continues to be used everywhere, and RLS acts as the security layer.

**Admin identification:** Email check in policies (`auth.jwt() ->> 'email' = 'ejumlauf@gmail.com'`). Simplest option for a single-admin setup.

**Customer identification:** Match `customers.email` to `auth.jwt() ->> 'email'`. No schema changes needed.

## Tables and Policies

### Catalog Tables (public read, admin write)

**Applies to:** `plants`, `plant_variants`, `plant_images`, `categories`, `shipping_config`

- `public_read` (SELECT): `USING (true)` - anyone can browse the catalog
- `admin_write` (INSERT/UPDATE/DELETE): `USING/WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')`

### Customers (own-data read, admin write)

- `own_read` (SELECT): Customer can read their own record where `email = auth.jwt() ->> 'email'`, admin can read all
- `admin_write` (INSERT/UPDATE/DELETE): Admin only

### Orders (own-data read, authenticated insert, admin manage)

- `own_read` (SELECT): Customer can read orders where `customer_id` matches their customer record (via email lookup), admin can read all
- `authenticated_insert` (INSERT): Any authenticated user can create orders (checkout flow)
- `admin_write` (UPDATE): Admin only
- `admin_delete` (DELETE): Admin only

### Order Details (own-data read, authenticated insert, admin manage)

- `own_read` (SELECT): Customer can read order details where the parent order belongs to them (order_details -> orders -> customers -> email chain), admin can read all
- `authenticated_insert` (INSERT): Any authenticated user can add items (checkout flow)
- `admin_write` (UPDATE): Admin only
- `admin_delete` (DELETE): Admin only

## Implementation Notes

- All policies use `auth.jwt()` to extract claims from the Supabase auth token
- `auth.role() = 'authenticated'` checks for any signed-in user
- Unauthenticated requests use the `anon` role, which only gets public read on catalog tables
- The subquery pattern for order details (`order_id IN (SELECT id FROM orders WHERE ...)`) ensures data access follows the ownership chain
- No service role key is introduced; all operations go through RLS
- Existing API route auth checks remain as a defense-in-depth layer

## Migration

Delivered as a single SQL migration file that:
1. Enables RLS on all 8 tables
2. Creates all policies
3. Is idempotent (uses `DROP POLICY IF EXISTS` before `CREATE POLICY`)

## Testing

- Verify unauthenticated users can read catalog tables
- Verify unauthenticated users cannot read customers/orders
- Verify admin can read/write all tables
- Verify authenticated non-admin users can only see their own customer/order data
- Verify the storefront and admin panel still work end-to-end
