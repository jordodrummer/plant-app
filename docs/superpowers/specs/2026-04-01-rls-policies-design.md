# Row Level Security (RLS) Policies Design

## Problem

All 8 database tables have no RLS policies. The Supabase anon key is exposed client-side, meaning anyone with the key can query tables directly via the Supabase REST API, bypassing application-level auth checks. Customer PII (names, emails, addresses) and order data are exposed.

## Approach

Enable RLS on all tables with policies enforced at the database level. Introduce a service role client for server-side operations so that existing app-level auth checks continue to work. RLS acts as defense-in-depth against direct Supabase REST API access.

**Two-layer security model:**
1. **RLS (database layer):** Protects against direct API access using the anon key. Unauthenticated users can only read catalog tables. Authenticated users can read their own customer/order data.
2. **Service role client (server layer):** Server-side DB functions use `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. Existing API route auth checks (admin email verification) guard these operations.

**Admin identification:** Email check in policies (`auth.jwt() ->> 'email' = 'ejumlauf@gmail.com'`). Simplest option for a single-admin setup.

**Customer identification:** Match `customers.email` to `auth.jwt() ->> 'email'`. No schema changes needed.

## Service Role Client

**Why:** All `src/lib/db/*.ts` functions use `getSupabase()`, a singleton client created with `createClient(url, anonKey)` and no auth context. With RLS enabled, `auth.jwt()` returns NULL for this client, causing all non-public queries to fail silently.

**Solution:** Add a `getServiceSupabase()` function to `src/lib/supabase/server.ts` that uses `SUPABASE_SERVICE_ROLE_KEY`. Update all `src/lib/db/*.ts` files to import and use this client instead of `getSupabase()`.

**Files affected:**
- `src/lib/supabase/server.ts` (add `getServiceSupabase()`)
- `src/lib/db/categories.ts`
- `src/lib/db/customers.ts`
- `src/lib/db/images.ts`
- `src/lib/db/items.ts`
- `src/lib/db/order-items.ts`
- `src/lib/db/orders.ts`
- `src/lib/db/shipping.ts`
- `src/lib/db/variants.ts`
- `src/app/api/shipping/rates/route.ts` (also uses `getSupabase()` directly)

**Security:** The service role key is server-only (not prefixed with `NEXT_PUBLIC_`), so it is never exposed to the browser. It must only be used in server-side code.

## Tables and Policies

### Catalog Tables (public read, admin write)

**Applies to:** `plants`, `plant_variants`, `plant_images`, `categories`, `shipping_config`

- `public_read` (SELECT): `USING (true)` - anyone can browse the catalog
- `admin_insert` (INSERT): `WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')`
- `admin_update` (UPDATE): `USING/WITH CHECK (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')`
- `admin_delete` (DELETE): `USING (auth.jwt() ->> 'email' = 'ejumlauf@gmail.com')`

### Customers (own-data read, self-insert, admin write)

- `own_read` (SELECT): Customer can read their own record where `email = auth.jwt() ->> 'email'`, admin can read all
- `self_insert` (INSERT): Authenticated users can insert a row where `email = auth.jwt() ->> 'email'` (checkout/signup flow)
- `admin_insert` (INSERT): Admin can insert any customer
- `admin_update` (UPDATE): Admin only
- `admin_delete` (DELETE): Admin only

### Orders (own-data read, authenticated insert, admin manage)

- `own_read` (SELECT): Customer can read orders where `customer_id` matches their customer record (via email lookup), admin can read all
- `authenticated_insert` (INSERT): Any authenticated user can create orders (checkout flow)
- `admin_update` (UPDATE): Admin only
- `admin_delete` (DELETE): Admin only

### Order Details (own-data read, authenticated insert, admin manage)

- `own_read` (SELECT): Customer can read order details where the parent order belongs to them (order_details -> orders -> customers -> email chain), admin can read all
- `authenticated_insert` (INSERT): Any authenticated user can add items (checkout flow)
- `admin_update` (UPDATE): Admin only
- `admin_delete` (DELETE): Admin only

## Implementation Notes

- All policies use `auth.jwt()` to extract claims from the Supabase auth token
- `auth.role() = 'authenticated'` checks for any signed-in user
- Unauthenticated requests use the `anon` role, which only gets public read on catalog tables
- The subquery pattern for order details (`order_id IN (SELECT id FROM orders WHERE ...)`) ensures data access follows the ownership chain
- Server-side operations bypass RLS via the service role key
- Existing API route auth checks remain as the primary authorization layer for server-side operations
- The migration should be wrapped in a transaction (`BEGIN; ... COMMIT;`) for atomic application

## Migration

Delivered as a single SQL migration file that:
1. Enables RLS on all 8 tables
2. Creates all policies (including `self_insert` on customers)
3. Is idempotent (uses `DROP POLICY IF EXISTS` before `CREATE POLICY`)
4. Is wrapped in a transaction

## Testing

- Verify unauthenticated users can read catalog tables
- Verify unauthenticated users cannot read customers/orders
- Verify admin can read/write all tables via the admin panel
- Verify authenticated non-admin users can only see their own customer/order data
- Verify the storefront and admin panel still work end-to-end
- Verify the service role key is not exposed in any client-side code
