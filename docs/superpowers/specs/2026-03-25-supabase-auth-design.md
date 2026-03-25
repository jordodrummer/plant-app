# Supabase Auth Design

## Overview

Add authentication to the Rare Succulent Inventory app using Supabase Auth. Supports email/password and Google OAuth sign-in. Admin identified by hardcoded email. Protects image uploads, API mutations, and a future admin page.

## Sign-in Methods

- Email + password (with sign-up flow)
- Google OAuth (one-click sign-in)

## User Roles

- **Admin:** Identified by `process.env.ADMIN_EMAIL`. Has access to image uploads, API mutations, and `/admin` page.
- **Customer:** Any signed-in user who is not admin. Can checkout and view order history (future).
- **Anonymous:** Not signed in. Can browse products and use the cart. Cannot checkout or mutate data.

## Protected Resources

| Resource | Access |
|----------|--------|
| Browse products, product detail | Everyone |
| Shopping cart | Everyone (localStorage) |
| Image uploads (`/api/upload`) | Admin only |
| Orders API (all methods) | Signed-in users |
| Order items API (all methods) | Signed-in users |
| `/admin` page (future) | Admin only |

## New Dependencies

- `@supabase/ssr` (must be installed: `npm install @supabase/ssr`)

## Environment Variables

Add to `.env.local`:
```
ADMIN_EMAIL=your-email@example.com
```

Add to Vercel production env vars as well (not NEXT_PUBLIC, server-only).

## New Files

### `src/lib/supabase/server.ts` (update)

Update to create a cookie-based Supabase client for server components and API routes. Uses `@supabase/ssr` `createServerClient` with the Next.js cookies API.

Two exports:
- `createServerSupabase()` for server components and API routes (per-request, cookie-based, used for auth checks)
- `getSupabase()` kept for backward compatibility with existing query functions (non-auth data queries using the anon key singleton)

**Data layer strategy:** RLS is not enabled. Data access is controlled at the API route level (auth checks before calling query functions). The existing `getSupabase()` singleton is sufficient for data queries since all authorization happens in the route handlers, not at the database level. If RLS is enabled in the future, all query functions would need to migrate to the per-request `createServerSupabase()` client.

### `src/lib/supabase/client.ts` (new)

Browser-side Supabase client using `@supabase/ssr` `createBrowserClient`. Used by client components for sign-in/sign-out.

### `src/lib/supabase/middleware.ts` (new)

Helper that creates a Supabase client for middleware context. Refreshes the auth session on each request by reading/writing cookies.

### `src/middleware.ts` (new)

Next.js middleware at the root. Calls the Supabase middleware helper to refresh tokens. Runs on all routes except static files.

### `src/app/auth/sign-in/page.tsx` (new)

Sign-in page with:
- Email + password form
- "Sign in with Google" button
- Link to sign-up page
- Error display
- Redirects to home on success

### `src/app/auth/sign-up/page.tsx` (new)

Sign-up page with:
- Email + password form
- Link to sign-in page
- Success message ("Check your email for confirmation")

### `src/app/auth/callback/route.ts` (new)

OAuth callback handler. Exchanges the auth code for a session after Google OAuth redirect.

### `src/components/auth-button.tsx` (new, client component)

Displayed in the nav bar. Shows:
- "Sign In" link when not authenticated
- User email + "Sign Out" button when authenticated

### Updated Files

**`src/components/nav.tsx`:** Add AuthButton component next to CartIcon.

**`src/app/api/upload/route.ts`:** Check for admin session before allowing upload. Return 401 if not signed in, 403 if not admin.

**`src/app/api/orders/route.ts`:** Check for signed-in session on all methods (GET, POST, PUT, DELETE). Order data contains customer info and is sensitive.

**`src/app/api/order-items/route.ts`:** Check for signed-in session on all methods (GET, POST, DELETE).

## Auth Check Pattern

For API routes:
```typescript
import { createServerSupabase } from "@/lib/supabase/server";

// Check signed in
const supabase = await createServerSupabase();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Check admin
if (user.email !== process.env.ADMIN_EMAIL) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

## Google OAuth Setup

Requires configuration in Supabase dashboard:
1. Go to Authentication > Providers > Google
2. Add Google OAuth client ID and secret (from Google Cloud Console)
3. Set redirect URL to `https://pjfnlqvnplkbljazcxkf.supabase.co/auth/v1/callback`

This is a manual step the developer must do in the Supabase and Google Cloud dashboards.

## Flow

1. User clicks "Sign In" in nav
2. Redirected to `/auth/sign-in`
3. Enters email/password or clicks "Sign in with Google"
4. Supabase handles authentication
5. On success, redirected back to home page
6. Session stored in cookies, refreshed by middleware on each request
7. Nav shows user email + Sign Out
8. Protected API routes check session before allowing mutations
9. Sign out clears the session and redirects to the home page

## Security Notes

- **CSRF:** Supabase SSR sets cookies with `SameSite=Lax` by default, which prevents cross-origin form submissions from sending the auth cookie. This is sufficient protection for the current API routes.
- **Session expiry:** When middleware fails to refresh an expired token, the user becomes unauthenticated silently. Protected routes return 401 and the UI shows "Sign In" again.
- **Checkout:** When checkout is added, the cart page or checkout action should redirect unauthenticated users to `/auth/sign-in` with a return URL.

## Known Limitations

- Single admin email. If multiple admins are needed later, migrate to an `admin_users` table or Supabase custom claims in `app_metadata`.
- No email verification enforcement yet (Supabase sends confirmation emails by default, but the app does not block unverified users).
