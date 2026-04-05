# RLS Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable Row Level Security on all 8 database tables and add a service role client so server-side operations bypass RLS while direct API access is protected.

**Architecture:** Two changes: (1) Add a `getServiceSupabase()` function using `SUPABASE_SERVICE_ROLE_KEY` and switch all `src/lib/db/*.ts` files to use it. (2) SQL migration enables RLS and creates policies on all tables. Server-side code bypasses RLS via the service role key. Browser-side access is protected by RLS policies.

**Tech Stack:** PostgreSQL, Supabase RLS, TypeScript, SQL

---

## File Structure

- Modify: `src/lib/supabase/server.ts` - add `getServiceSupabase()` function
- Modify: `src/lib/db/categories.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/customers.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/images.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/items.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/order-items.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/orders.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/shipping.ts` - switch to `getServiceSupabase()`
- Modify: `src/lib/db/variants.ts` - switch to `getServiceSupabase()`
- Modify: `src/app/api/shipping/rates/route.ts` - switch to `getServiceSupabase()`
- Modify: `docs/migrations/2026-04-01-rls-policies.sql` - add self_insert policy on customers, wrap in transaction

---

### Task 1: Add service role client to Supabase server module

**Files:**
- Modify: `src/lib/supabase/server.ts`

- [ ] **Step 1: Add `getServiceSupabase()` to server.ts**

Add a new service role client below the existing `getSupabase()` function. The service role key bypasses RLS entirely and must only be used server-side.

Add after line 9 (`if (!supabaseKey) throw new Error(...)`):

```typescript
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
```

Add after the existing `getSupabase()` function (after line 16):

```typescript
// Service role client for server-side DB operations (bypasses RLS)
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);

export function getServiceSupabase() {
  return serviceSupabase;
}
```

- [ ] **Step 2: Add SUPABASE_SERVICE_ROLE_KEY to .env.local**

Add the following line to `.env.local` (the actual key value must be obtained from Supabase dashboard > Settings > API > service_role key):

```
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-here>
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/server.ts
git commit -m "add service role Supabase client for server-side operations"
```

---

### Task 2: Switch all DB functions to use service role client

**Files:**
- Modify: `src/lib/db/categories.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/customers.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/images.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/items.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/order-items.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/orders.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/shipping.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/lib/db/variants.ts` - line 1: change import from `getSupabase` to `getServiceSupabase`
- Modify: `src/app/api/shipping/rates/route.ts` - line 2: change import from `getSupabase` to `getServiceSupabase`

In each file, two changes are needed:
1. Change the import: `import { getSupabase } from "../supabase/server"` becomes `import { getServiceSupabase } from "../supabase/server"`
2. Change every call: `getSupabase()` becomes `getServiceSupabase()`

For `src/app/api/shipping/rates/route.ts`, the import path is `@/lib/supabase/server` instead of relative.

- [ ] **Step 1: Update categories.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Every occurrence of getSupabase() becomes getServiceSupabase()
// Lines 5, 15, 27: const supabase = getServiceSupabase();
```

- [ ] **Step 2: Update customers.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 46: const supabase = getServiceSupabase();
```

- [ ] **Step 3: Update images.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 17, 29, 40: const supabase = getServiceSupabase();
```

- [ ] **Step 4: Update items.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 33, 63, 75, 94, 107: const supabase = getServiceSupabase();
```

- [ ] **Step 5: Update order-items.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 22, 40: const supabase = getServiceSupabase();
```

- [ ] **Step 6: Update orders.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 15, 27, 39, 52: const supabase = getServiceSupabase();
```

- [ ] **Step 7: Update shipping.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 16: const supabase = getServiceSupabase();
```

- [ ] **Step 8: Update variants.ts**

```typescript
// Line 1: change import
import { getServiceSupabase } from "../supabase/server";

// Lines 5, 17, 43, 81, 109: const supabase = getServiceSupabase();
```

- [ ] **Step 9: Update shipping/rates/route.ts**

```typescript
// Line 2: change import
import { getServiceSupabase } from "@/lib/supabase/server";

// Line 24: const supabase = getServiceSupabase();
```

- [ ] **Step 10: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 11: Commit**

```bash
git add src/lib/db/categories.ts src/lib/db/customers.ts src/lib/db/images.ts src/lib/db/items.ts src/lib/db/order-items.ts src/lib/db/orders.ts src/lib/db/shipping.ts src/lib/db/variants.ts src/app/api/shipping/rates/route.ts
git commit -m "switch all DB functions to service role client"
```

---

### Task 3: Update RLS migration with self_insert policy and transaction wrapper

**Files:**
- Modify: `docs/migrations/2026-04-01-rls-policies.sql`

- [ ] **Step 1: Add transaction wrapper and self_insert policy**

Wrap the entire migration in `BEGIN; ... COMMIT;` for atomic application.

Add `BEGIN;` at the top of the file (before the first ALTER TABLE).

In the customers section, add the `self_insert` policy after the `own_read` policy:

```sql
DROP POLICY IF EXISTS "self_insert" ON customers;
CREATE POLICY "self_insert" ON customers FOR INSERT
  WITH CHECK (email = auth.jwt() ->> 'email');
```

Add `COMMIT;` at the end of the file.

- [ ] **Step 2: Commit**

```bash
git add docs/migrations/2026-04-01-rls-policies.sql
git commit -m "add self_insert policy on customers and transaction wrapper"
```

---

### Task 4: Run migration in Supabase and verify

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

Expected: policies for all 8 tables, including `self_insert` on customers.

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
