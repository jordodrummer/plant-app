# Admin Portal with Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a protected admin portal for managing products, orders, and customers, plus a site-wide dark mode toggle.

**Architecture:** Admin pages live under `src/app/admin/` with a shared layout providing tab navigation. Middleware guards `/admin/*` by checking the user's email against `ADMIN_EMAIL`. Dark mode uses `next-themes` with the existing `.dark` CSS variables already defined in `globals.css`.

**Tech Stack:** Next.js 16 App Router, Supabase, next-themes, shadcn/ui, Tailwind CSS v4, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-25-admin-portal-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/components/theme-toggle.tsx` | Dark mode sun/moon toggle button |
| `src/components/theme-provider.tsx` | next-themes ThemeProvider wrapper |
| `src/components/admin-tabs.tsx` | Tab navigation for admin sections |
| `src/app/admin/layout.tsx` | Admin layout with auth guard + tabs |
| `src/app/admin/page.tsx` | Redirect to /admin/products |
| `src/app/admin/products/page.tsx` | Product list table |
| `src/app/admin/products/new/page.tsx` | Create product page |
| `src/app/admin/products/[id]/page.tsx` | Edit product page |
| `src/app/admin/products/product-form.tsx` | Shared product create/edit form |
| `src/app/admin/orders/page.tsx` | Order list table |
| `src/app/admin/orders/[id]/page.tsx` | Order detail page |
| `src/app/admin/orders/[id]/order-status-select.tsx` | Status dropdown client component |
| `src/app/admin/customers/page.tsx` | Customer list table |
| `src/app/admin/customers/[id]/page.tsx` | Customer detail page |
| `src/lib/db/customers.ts` | Customer query functions |
| `src/app/api/plants/route.ts` | Plant list + create API |
| `src/app/api/plants/[id]/route.ts` | Plant get/update/delete API |
| `src/app/api/variants/route.ts` | Variant create API |
| `src/app/api/variants/[id]/route.ts` | Variant update/delete API |
| `src/app/api/categories/route.ts` | Category list API |

### Modified Files

| File | Changes |
|---|---|
| `src/app/layout.tsx` | Wrap in ThemeProvider, add suppressHydrationWarning |
| `src/components/nav.tsx` | Add theme toggle, admin link for admin users |
| `src/lib/supabase/middleware.ts` | Add admin route protection |
| `src/lib/db/variants.ts` | Add updateVariant and deleteVariant functions |
| `src/lib/db/images.ts` | Add deleteImagesByPlantId function |
| `src/lib/types.ts` | Add CustomerWithStats type |

---

### Task 1: Install next-themes and set up dark mode

**Files:**
- Modify: `package.json`
- Create: `src/components/theme-provider.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/nav.tsx`

- [ ] **Step 1: Install next-themes**

```bash
npm install next-themes
```

- [ ] **Step 2: Create ThemeProvider wrapper**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 3: Create theme toggle component**

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <Button variant="ghost" size="icon" className="h-8 w-8" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

- [ ] **Step 4: Wrap root layout in ThemeProvider**

Modify `src/app/layout.tsx`. The full file should be:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rare Succulent Inventory",
  description: "Browse and shop rare cacti and succulents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <ThemeProvider>
          <CartProvider>
            <Nav />
            <main className="container mx-auto flex-1 px-4 py-8">{children}</main>
            <Footer />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Add theme toggle to nav**

Modify `src/components/nav.tsx`. The full file should be:

```tsx
import Link from "next/link";
import CartIcon from "@/components/cart-icon";
import AuthButton from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Rare Succulent Inventory
        </Link>
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
          Products
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <AuthButton />
          <CartIcon />
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 6: Verify dark mode works**

```bash
npm run dev
```

Open http://localhost:3000, click the moon/sun toggle. Light and dark should swap using the existing CSS variables in globals.css.

- [ ] **Step 7: Commit**

```bash
git add src/components/theme-provider.tsx src/components/theme-toggle.tsx src/app/layout.tsx src/components/nav.tsx package.json package-lock.json
git commit -m "add site-wide dark mode toggle with next-themes"
```

---

### Task 2: Add admin route protection in middleware

**Files:**
- Modify: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Update middleware to protect /admin routes**

Modify `src/lib/supabase/middleware.ts`. The full file should be:

```ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      const signInUrl = request.nextUrl.clone();
      signInUrl.pathname = "/auth/sign-in";
      return NextResponse.redirect(signInUrl);
    }
  }

  return supabaseResponse;
}
```

- [ ] **Step 2: Verify non-admin users are redirected**

Open http://localhost:3000/admin in an incognito window (not signed in). It should redirect to /auth/sign-in.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/middleware.ts
git commit -m "protect /admin routes in middleware with email check"
```

---

### Task 3: Create admin layout with tab navigation

**Files:**
- Create: `src/components/admin-tabs.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create admin tabs component**

Create `src/components/admin-tabs.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 border-b pb-3">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
import AdminTabs from "@/components/admin-tabs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminTabs />
      <div className="py-6">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create admin index redirect**

Create `src/app/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/products");
}
```

- [ ] **Step 4: Add admin link to nav for admin users**

Modify `src/components/nav.tsx`. Add an admin link that only shows for admin users. The full file should be:

```tsx
import Link from "next/link";
import CartIcon from "@/components/cart-icon";
import AuthButton from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminLink from "@/components/admin-link";

export default function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Rare Succulent Inventory
        </Link>
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
          Products
        </Link>
        <AdminLink />
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle />
          <AuthButton />
          <CartIcon />
        </div>
      </div>
    </nav>
  );
}
```

Create `src/components/admin-link.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = useMemo(() => createBrowserSupabase(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAdmin(session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!isAdmin) return null;

  return (
    <Link href="/admin" className="text-sm font-medium text-green-600 hover:text-green-500">
      Admin
    </Link>
  );
}
```

**Important:** The admin link uses `NEXT_PUBLIC_ADMIN_EMAIL` (client-side accessible) to decide whether to show the link. Add this to `.env.local`:

```
NEXT_PUBLIC_ADMIN_EMAIL=ejumlauf@gmail.com
```

This is safe to expose since it only controls UI visibility. The actual protection is in middleware and API routes using the server-side `ADMIN_EMAIL`.

- [ ] **Step 5: Verify admin layout renders**

Sign in as the admin email, navigate to /admin. You should see the tab bar with Products, Orders, Customers. Non-admin users should be redirected.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin-tabs.tsx src/components/admin-link.tsx src/app/admin/layout.tsx src/app/admin/page.tsx src/components/nav.tsx
git commit -m "add admin layout with tab navigation and nav link"
```

---

### Task 4: Add new database query functions

**Files:**
- Create: `src/lib/db/customers.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db/variants.ts`
- Modify: `src/lib/db/images.ts`

- [ ] **Step 1: Add new types**

Add to the end of `src/lib/types.ts`:

```ts
export type CustomerWithStats = Customer & {
  order_count: number;
  total_spent: number;
};
```

- [ ] **Step 2: Create customer query functions**

Create `src/lib/db/customers.ts`:

```ts
import { getSupabase } from "../supabase/server";
import type { Customer, CustomerWithStats } from "../types";

export async function getCustomers(): Promise<CustomerWithStats[]> {
  const supabase = getSupabase();
  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      *,
      orders (
        id,
        status,
        order_details (price_each, quantity)
      )
    `)
    .order("name");

  if (error) throw error;

  return (customers ?? []).map((c) => {
    const activeOrders = (c.orders ?? []).filter(
      (o: { status: string }) => o.status !== "deleted"
    );
    return {
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      state: c.state,
      zip: c.zip,
      email: c.email,
      order_count: activeOrders.length,
      total_spent: activeOrders.reduce(
        (sum: number, o: { order_details: { price_each: number; quantity: number }[] }) =>
          sum + (o.order_details ?? []).reduce(
            (s: number, d: { price_each: number; quantity: number }) => s + d.price_each * d.quantity,
            0
          ),
        0
      ),
    };
  });
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}
```

- [ ] **Step 3: Add updateVariant and deleteVariant to variants.ts**

Add to the end of `src/lib/db/variants.ts`:

```ts
export async function updateVariant(
  id: number,
  fields: Partial<Omit<PlantVariant, "id" | "plant_id">>
): Promise<PlantVariant | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_variants")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  // Update parent plant in_stock
  const { data: variants } = await supabase
    .from("plant_variants")
    .select("inventory")
    .eq("plant_id", data.plant_id)
    .gt("inventory", 0)
    .limit(1);

  await supabase
    .from("plants")
    .update({ in_stock: (variants?.length ?? 0) > 0 })
    .eq("id", data.plant_id);

  return data;
}

export async function deleteVariant(id: number): Promise<boolean> {
  const supabase = getSupabase();

  // Get plant_id before deleting
  const { data: variant } = await supabase
    .from("plant_variants")
    .select("plant_id")
    .eq("id", id)
    .single();

  const { error, count } = await supabase
    .from("plant_variants")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;

  // Update parent plant in_stock
  if (variant) {
    const { data: remaining } = await supabase
      .from("plant_variants")
      .select("inventory")
      .eq("plant_id", variant.plant_id)
      .gt("inventory", 0)
      .limit(1);

    await supabase
      .from("plants")
      .update({ in_stock: (remaining?.length ?? 0) > 0 })
      .eq("id", variant.plant_id);
  }

  return (count ?? 0) > 0;
}
```

- [ ] **Step 4: Add deleteImagesByPlantId to images.ts**

Add to the end of `src/lib/db/images.ts`:

```ts
export async function deleteImagesByPlantId(plantId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("plant_images")
    .delete()
    .eq("plant_id", plantId);

  if (error) throw error;
}
```

- [ ] **Step 5: Verify build succeeds**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/db/customers.ts src/lib/db/variants.ts src/lib/db/images.ts
git commit -m "add customer queries, variant update/delete, image cascade delete"
```

---

### Task 5: Create plant and variant API routes

**Files:**
- Create: `src/app/api/plants/route.ts`
- Create: `src/app/api/plants/[id]/route.ts`
- Create: `src/app/api/variants/route.ts`
- Create: `src/app/api/variants/[id]/route.ts`
- Create: `src/app/api/categories/route.ts`

- [ ] **Step 1: Create plants list + create route**

Create `src/app/api/plants/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getItems, createItem } from "@/lib/db/items";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const plants = await getItems();
    return NextResponse.json(plants);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { cultivar_name, category_id, details, in_stock } = body;

    if (!cultivar_name || !category_id) {
      return NextResponse.json({ error: "cultivar_name and category_id are required" }, { status: 400 });
    }

    const plant = await createItem({
      cultivar_name,
      category_id,
      details: details ?? null,
      in_stock: in_stock ?? false,
    });
    return NextResponse.json(plant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create plant get/update/delete route**

Create `src/app/api/plants/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getItemById, updateItem, deleteItem } from "@/lib/db/items";
import { deleteImagesByPlantId } from "@/lib/db/images";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const plant = await getItemById(Number(id));
    if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(plant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const plant = await updateItem(Number(id), body);
    if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(plant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const plantId = Number(id);

    // Cascade: delete images first, then variants are handled by DB cascade or manual delete
    await deleteImagesByPlantId(plantId);
    const deleted = await deleteItem(plantId);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create variant routes**

Create `src/app/api/variants/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createVariant } from "@/lib/db/variants";
import { createServerSupabase } from "@/lib/supabase/server";
import type { VariantType } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { plant_id, variant_type, price, inventory, label, note, sort_order } = body;

    if (!plant_id || !variant_type || price == null) {
      return NextResponse.json({ error: "plant_id, variant_type, and price are required" }, { status: 400 });
    }

    const variant = await createVariant({
      plant_id,
      variant_type: variant_type as VariantType,
      price,
      inventory: inventory ?? 0,
      label: label ?? null,
      note: note ?? null,
      sort_order: sort_order ?? 0,
    });
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

Create `src/app/api/variants/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { updateVariant, deleteVariant } from "@/lib/db/variants";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const variant = await updateVariant(Number(id), body);
    if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(variant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const deleted = await deleteVariant(Number(id));
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create categories list route**

Create `src/app/api/categories/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db/categories";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Verify build succeeds**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/plants src/app/api/variants src/app/api/categories
git commit -m "add plant, variant, and category API routes"
```

---

### Task 6: Admin products list page

**Files:**
- Create: `src/app/admin/products/page.tsx`

- [ ] **Step 1: Create products list page**

Create `src/app/admin/products/page.tsx`:

```tsx
import Link from "next/link";
import { getItems } from "@/lib/db/items";
import { getCategories } from "@/lib/db/categories";
import { Button } from "@/components/ui/button";

export default async function AdminProductsPage() {
  const [plants, categories] = await Promise.all([getItems(), getCategories()]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">+ New Plant</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Variants</th>
              <th className="px-4 py-3 text-left font-medium">In Stock</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.id} className="border-b">
                <td className="px-4 py-3 font-medium">{plant.cultivar_name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {categoryMap.get(plant.category_id) ?? "Unknown"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {plant.variant_count} variant{plant.variant_count !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <span className={plant.in_stock ? "text-green-600" : "text-muted-foreground"}>
                    {plant.in_stock ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${plant.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {plants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No products yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders**

Navigate to /admin/products while signed in as admin. Table should show existing plants.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/products/page.tsx
git commit -m "add admin products list page"
```

---

### Task 7: Admin product form (create and edit)

**Files:**
- Create: `src/app/admin/products/product-form.tsx`
- Create: `src/app/admin/products/new/page.tsx`
- Create: `src/app/admin/products/[id]/page.tsx`

- [ ] **Step 1: Create the shared product form component**

Create `src/app/admin/products/product-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/image-upload";
import type { Plant, PlantVariant, PlantImage, Category, VariantType } from "@/lib/types";

const VARIANT_TYPES: VariantType[] = [
  "cutting", "rooted_cutting", "cut_to_order", "mother_stand",
  "seedling", "op_seeds", "hybrid_seeds",
];

type VariantRow = {
  id?: number;
  variant_type: VariantType;
  price: string;
  inventory: string;
  label: string;
  note: string;
  sort_order: number;
};

type Props = {
  plant?: Plant;
  variants?: PlantVariant[];
  images?: PlantImage[];
  categories: Category[];
};

export default function ProductForm({ plant, variants, images, categories }: Props) {
  const router = useRouter();
  const isEdit = !!plant;

  const [cultivarName, setCultivarName] = useState(plant?.cultivar_name ?? "");
  const [categoryId, setCategoryId] = useState(plant?.category_id?.toString() ?? "");
  const [details, setDetails] = useState(plant?.details ?? "");
  const [inStock, setInStock] = useState(plant?.in_stock ?? false);
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    variants?.map((v) => ({
      id: v.id,
      variant_type: v.variant_type,
      price: v.price.toString(),
      inventory: v.inventory.toString(),
      label: v.label ?? "",
      note: v.note ?? "",
      sort_order: v.sort_order,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addVariantRow() {
    setVariantRows([
      ...variantRows,
      {
        variant_type: "cutting",
        price: "0",
        inventory: "0",
        label: "",
        note: "",
        sort_order: variantRows.length,
      },
    ]);
  }

  function updateVariantRow(index: number, field: keyof VariantRow, value: string) {
    const rows = [...variantRows];
    rows[index] = { ...rows[index], [field]: value };
    setVariantRows(rows);
  }

  function removeVariantRow(index: number) {
    setVariantRows(variantRows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Save plant
      const plantBody = {
        cultivar_name: cultivarName,
        category_id: Number(categoryId),
        details: details || null,
        in_stock: inStock,
      };

      let plantId = plant?.id;

      if (isEdit) {
        const res = await fetch(`/api/plants/${plantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantBody),
        });
        if (!res.ok) throw new Error("Failed to update plant");
      } else {
        const res = await fetch("/api/plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantBody),
        });
        if (!res.ok) throw new Error("Failed to create plant");
        const created = await res.json();
        plantId = created.id;
      }

      // Save variants
      for (const row of variantRows) {
        const variantBody = {
          plant_id: plantId,
          variant_type: row.variant_type,
          price: parseFloat(row.price),
          inventory: parseInt(row.inventory, 10),
          label: row.label || null,
          note: row.note || null,
          sort_order: row.sort_order,
        };

        if (row.id) {
          await fetch(`/api/variants/${row.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variantBody),
          });
        } else {
          await fetch("/api/variants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variantBody),
          });
        }
      }

      // Delete removed variants
      if (isEdit && variants) {
        const keepIds = new Set(variantRows.filter((r) => r.id).map((r) => r.id));
        for (const v of variants) {
          if (!keepIds.has(v.id)) {
            await fetch(`/api/variants/${v.id}`, { method: "DELETE" });
          }
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!plant || !confirm("Delete this plant and all its variants and images?")) return;
    setSaving(true);
    const res = await fetch(`/api/plants/${plant.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError("Failed to delete plant");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Plant Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Cultivar Name</label>
            <input
              required
              value={cultivarName}
              onChange={(e) => setCultivarName(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full rounded border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
          />
          In Stock
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Variants</h2>
        {variantRows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Type</label>
              <select
                value={row.variant_type}
                onChange={(e) => updateVariantRow(i, "variant_type", e.target.value)}
                className="rounded border bg-background px-2 py-1.5 text-sm"
              >
                {VARIANT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={row.price}
                onChange={(e) => updateVariantRow(i, "price", e.target.value)}
                className="w-24 rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Stock</label>
              <input
                type="number"
                min="0"
                value={row.inventory}
                onChange={(e) => updateVariantRow(i, "inventory", e.target.value)}
                className="w-20 rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">Label</label>
              <input
                value={row.label}
                onChange={(e) => updateVariantRow(i, "label", e.target.value)}
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeVariantRow(i)}
              className="text-destructive"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addVariantRow}>
          + Add Variant
        </Button>
      </section>

      {isEdit && plant && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Images</h2>
          {images && images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt={img.caption ?? ""}
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                  <span className="mt-1 block text-center text-xs text-muted-foreground">
                    {img.image_type}
                  </span>
                </div>
              ))}
            </div>
          )}
          <ImageUpload plantId={plant.id} onUpload={() => router.refresh()} />
        </section>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Plant"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto"
          >
            Delete Plant
          </Button>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create the new product page**

Create `src/app/admin/products/new/page.tsx`:

```tsx
import { getCategories } from "@/lib/db/categories";
import ProductForm from "../product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">New Plant</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
```

- [ ] **Step 3: Create the edit product page**

Create `src/app/admin/products/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getItemById } from "@/lib/db/items";
import { getVariantsByPlantId } from "@/lib/db/variants";
import { getImagesByPlantId } from "@/lib/db/images";
import { getCategories } from "@/lib/db/categories";
import ProductForm from "../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plantId = Number(id);

  const [plant, variants, images, categories] = await Promise.all([
    getItemById(plantId),
    getVariantsByPlantId(plantId),
    getImagesByPlantId(plantId),
    getCategories(),
  ]);

  if (!plant) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Edit: {plant.cultivar_name}</h1>
      <ProductForm plant={plant} variants={variants} images={images} categories={categories} />
    </div>
  );
}
```

- [ ] **Step 4: Verify create and edit flows**

Navigate to /admin/products, click "+ New Plant", fill out the form, save. Then click "Edit" on an existing plant, verify data loads, make a change, save.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/products
git commit -m "add admin product form with create, edit, and delete"
```

---

### Task 8: Admin orders pages

**Files:**
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/orders/[id]/page.tsx`
- Create: `src/app/admin/orders/[id]/order-status-select.tsx`

- [ ] **Step 1: Create orders list page**

Create `src/app/admin/orders/page.tsx`:

```tsx
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  deleted: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default async function AdminOrdersPage() {
  const supabase = getSupabase();
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (name, email),
      order_details (price_each, quantity)
    `)
    .neq("status", "deleted")
    .order("created_on", { ascending: false });

  if (error) throw error;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Orders</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Order #</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Items</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const items = order.order_details ?? [];
              const total = items.reduce(
                (s: number, d: { price_each: number; quantity: number }) =>
                  s + d.price_each * d.quantity,
                0
              );
              return (
                <tr key={order.id} className="border-b">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.customers?.name ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_on).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">${total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create order status select component**

Create `src/app/admin/orders/[id]/order-status-select.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUSES = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (status === currentStatus) return;
    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Status:</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border bg-background px-2 py-1 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={handleSave} disabled={saving || status === currentStatus}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create order detail page**

Create `src/app/admin/orders/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/server";
import OrderStatusSelect from "./order-status-select";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      customers (*),
      order_details (
        *,
        plants (cultivar_name),
        plant_variants (variant_type, label)
      )
    `)
    .eq("id", Number(id))
    .single();

  if (error || !order) notFound();

  const items = order.order_details ?? [];
  const total = items.reduce(
    (s: number, d: { price_each: number; quantity: number }) =>
      s + d.price_each * d.quantity,
    0
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Order #{order.id}</h1>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Customer</h2>
          {order.customers ? (
            <>
              <p className="font-medium">
                <Link
                  href={`/admin/customers/${order.customers.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.customers.name}
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">{order.customers.email}</p>
              <p className="text-sm text-muted-foreground">
                {order.customers.address}, {order.customers.city}, {order.customers.state} {order.customers.zip}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Customer not found</p>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Order Info</h2>
          <p className="text-sm">
            <span className="text-muted-foreground">Created:</span>{" "}
            {new Date(order.created_on).toLocaleDateString()}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Updated:</span>{" "}
            {new Date(order.updated_on).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <h2 className="border-b px-4 py-3 text-sm font-semibold">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Plant</th>
              <th className="px-4 py-2 text-left font-medium">Variant</th>
              <th className="px-4 py-2 text-left font-medium">Qty</th>
              <th className="px-4 py-2 text-left font-medium">Price</th>
              <th className="px-4 py-2 text-left font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: {
              id: number;
              price_each: number;
              quantity: number;
              plants: { cultivar_name: string } | null;
              plant_variants: { variant_type: string; label: string | null } | null;
            }) => (
              <tr key={item.id} className="border-b">
                <td className="px-4 py-2">{item.plants?.cultivar_name ?? "Unknown"}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {item.plant_variants?.variant_type.replace(/_/g, " ") ?? "N/A"}
                </td>
                <td className="px-4 py-2">{item.quantity}</td>
                <td className="px-4 py-2">${item.price_each.toFixed(2)}</td>
                <td className="px-4 py-2">${(item.price_each * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right font-semibold">Total</td>
              <td className="px-4 py-2 font-semibold">${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify orders pages**

Navigate to /admin/orders. If you have orders, verify the list loads. Click an order to see detail. Change the status dropdown and save.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/orders
git commit -m "add admin orders list and detail pages with status updates"
```

---

### Task 9: Admin customers pages

**Files:**
- Create: `src/app/admin/customers/page.tsx`
- Create: `src/app/admin/customers/[id]/page.tsx`

- [ ] **Step 1: Create customers list page**

Create `src/app/admin/customers/page.tsx`:

```tsx
import Link from "next/link";
import { getCustomers } from "@/lib/db/customers";

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Customers</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Location</th>
              <th className="px-4 py-3 text-left font-medium">Orders</th>
              <th className="px-4 py-3 text-left font-medium">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.city}, {customer.state}
                </td>
                <td className="px-4 py-3">{customer.order_count}</td>
                <td className="px-4 py-3">${customer.total_spent.toFixed(2)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create customer detail page**

Create `src/app/admin/customers/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/lib/db/customers";
import { getSupabase } from "@/lib/supabase/server";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  deleted: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(Number(id));
  if (!customer) notFound();

  const supabase = getSupabase();
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_details (price_each, quantity)
    `)
    .eq("customer_id", customer.id)
    .neq("status", "deleted")
    .order("created_on", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{customer.name}</h1>

      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Contact Info</h2>
        <p className="text-sm">{customer.email}</p>
        <p className="text-sm text-muted-foreground">
          {customer.address}, {customer.city}, {customer.state} {customer.zip}
        </p>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Order History</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Order #</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Items</th>
              <th className="px-4 py-3 text-left font-medium">Total</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => {
              const items = order.order_details ?? [];
              const total = items.reduce(
                (s: number, d: { price_each: number; quantity: number }) =>
                  s + d.price_each * d.quantity,
                0
              );
              return (
                <tr key={order.id} className="border-b">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_on).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">${total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No orders for this customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify customers pages**

Navigate to /admin/customers. Verify the list loads. Click a customer name to see their detail page with order history.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/customers
git commit -m "add admin customers list and detail pages"
```

---

### Task 10: Final integration and build verification

**Files:**
- None new (verification only)

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Fix any type errors or build failures.

- [ ] **Step 2: Manual smoke test**

Test the full flow:
1. Open site, toggle dark mode on home page and products page
2. Sign in as admin
3. Verify "Admin" link appears in nav
4. Navigate through Products, Orders, Customers tabs
5. Create a new plant with variants
6. Edit an existing plant
7. View an order and change its status
8. View a customer and their order history
9. Sign out, verify /admin redirects to sign-in
10. Toggle dark mode in admin, verify styling

- [ ] **Step 3: Commit any final fixes and push**

```bash
git push origin <branch-name>
```
