# Admin Portal with Dark Mode - Design Spec

## Overview

Add a protected admin portal at `/admin` for managing products, orders, and customers. Add a site-wide dark mode toggle. Integrated with the existing store navigation (same top nav, admin sections as tabs).

## Scope

**In scope:**
- Admin portal with three sections: Products, Orders, Customers
- Full CRUD for products (plants, variants, images)
- Order list and detail views with status updates
- Customer list with order history
- Site-wide dark mode toggle (store + admin)
- Middleware-level route protection for `/admin/*`

**Out of scope:**
- Dashboard/analytics
- Multiple admin roles or database role tracking
- RLS policies
- Audit logging

## Access Control

### Admin Identification

Keep existing `ADMIN_EMAIL` env var approach. Single admin (the business owner). No database role column needed.

### Route Protection (Two Layers)

**Layer 1: Middleware** (`src/middleware.ts`)
- Intercept all `/admin/*` requests
- Call `supabase.auth.getUser()` to get the authenticated user
- Compare user email against `ADMIN_EMAIL` env var
- Redirect non-admins and unauthenticated users to `/auth/sign-in`

**Layer 2: API Routes**
- Existing `requireAuth()` + `isAdmin()` pattern on all admin API routes
- Already in place for `/api/orders`, `/api/order-items`, `/api/upload`
- Apply same pattern to new product/variant/category routes

## Routing Structure

```
src/app/admin/
  layout.tsx          -- admin tab navigation (Products | Orders | Customers)
  page.tsx            -- redirects to /admin/products
  products/
    page.tsx          -- product list table
    new/page.tsx      -- create product form
    [id]/page.tsx     -- edit product form
  orders/
    page.tsx          -- order list table
    [id]/page.tsx     -- order detail + status update
  customers/
    page.tsx          -- customer list table
    [id]/page.tsx     -- customer detail + order history
```

The admin layout sits inside the root layout, so the site nav (logo, products link, auth button, cart) remains visible. The admin layout adds a tab bar below it for switching between Products, Orders, and Customers.

## Admin Pages

### Products List (`/admin/products`)

Table columns: Name, Category, Variants (count), In Stock (yes/no), Actions (Edit, Delete).

"+ New Plant" button above the table.

### Product Form (`/admin/products/new` and `/admin/products/[id]`)

Shared form component used for both create and edit.

**Plant details section:**
- Cultivar name (text input)
- Category (dropdown, fetched from categories table)
- Details (textarea)
- In stock (checkbox)

**Variants section:**
- Dynamic list of variant rows
- Each row: variant type (dropdown: cutting, seeds, mother_stand, etc.), price, inventory count, label, note
- "+ Add variant" button to add rows
- Remove button on each row

**Images section:**
- Display existing images with type badges
- Upload new images using existing `/api/upload` route
- Set image type (plant, mother, father, cutting, grown_example) and caption
- Remove images

### Orders List (`/admin/orders`)

Table columns: Order # (linked), Customer name, Date, Item count, Total, Status (badge).

Status badges with colors:
- Pending: yellow
- Confirmed: blue
- Shipped: purple
- Delivered: green
- Deleted: gray

### Order Detail (`/admin/orders/[id]`)

- Order number and date
- Customer info (name, email, address)
- Order items list with plant name, variant, quantity, price
- Order total
- Status dropdown with save button (Pending, Confirmed, Shipped, Delivered)

### Customer List (`/admin/customers`)

Table columns: Name (linked), Email, Location (city, state), Order count, Total spent.

### Customer Detail (`/admin/customers/[id]`)

- Customer info (name, email, full address)
- Order history table (same columns as orders list, filtered to this customer)

## API Routes

### New Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/plants` | GET | List all plants with variants and images |
| `/api/plants` | POST | Create new plant |
| `/api/plants/[id]` | GET | Get single plant with variants and images |
| `/api/plants/[id]` | PUT | Update plant details |
| `/api/plants/[id]` | DELETE | Hard delete plant and cascade to associated variants/images |
| `/api/variants` | POST | Add variant to a plant |
| `/api/variants/[id]` | PUT | Update variant (price, inventory, label, etc.) |
| `/api/variants/[id]` | DELETE | Delete variant |
| `/api/categories` | GET | List all categories |

All new routes require admin authentication using the same `requireAuth()` + `isAdmin()` helpers.

### Existing Routes (No Changes)

- `/api/orders` - GET/POST/PUT/DELETE (already protected)
- `/api/order-items` - GET/POST/DELETE (already protected)
- `/api/upload` - POST (already protected)

## Dark Mode

### Implementation

- Install `next-themes` package
- Set Tailwind config `darkMode: "class"`
- Wrap app in `ThemeProvider` in root layout (`src/app/layout.tsx`)
- Add `suppressHydrationWarning` to `<html>` tag (required by next-themes)

### Toggle Component

- Sun/moon icon button in the nav bar, next to the auth button
- Cycles between: system, light, dark
- Persists preference in localStorage
- Defaults to system preference on first visit

### Styling

- All existing and new components use Tailwind `dark:` variants
- Backgrounds: `bg-white dark:bg-gray-950`
- Text: `text-gray-900 dark:text-gray-100`
- Borders and cards adjust accordingly
- Admin tables and forms follow the same dark mode patterns

## Components

### New Components

- `src/components/admin-tabs.tsx` - Tab navigation for admin sections
- `src/components/theme-toggle.tsx` - Dark mode toggle button
- `src/app/admin/products/product-form.tsx` - Shared create/edit form (client component)
- `src/app/admin/orders/order-status-select.tsx` - Status dropdown with save (client component)

### Modified Components

- `src/app/layout.tsx` - Add ThemeProvider, suppressHydrationWarning
- `src/components/nav.tsx` - Add theme toggle, add admin link (visible when admin)
- `src/middleware.ts` - Add admin route protection logic

## Data Flow

### Server Components (Read)

Admin list pages and detail pages are server components. They fetch data directly from Supabase using existing query functions in `src/lib/db/*.ts`, plus new query functions as needed (e.g., `getCustomerWithOrders`).

### Client Components (Write)

Forms and interactive elements (product form, status dropdown) are client components. They call API routes for mutations, then use `router.refresh()` to reload server component data.

## Error Handling

- Form validation on client side before submission
- API routes return appropriate HTTP status codes and error messages
- Toast or inline error messages for failed operations
- Optimistic UI is out of scope; forms show loading state during submission
