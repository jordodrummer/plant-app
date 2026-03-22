# Next.js + TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the plant inventory app into a single Next.js App Router project with TypeScript, shadcn/ui + Tailwind CSS, and raw `pg` for database access.

**Architecture:** Fresh Next.js project created at the repo root alongside the existing directories (kept for reference, never modified). Server components fetch data directly from PostgreSQL. API routes handle mutations for orders and order items.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL via `pg`, `tsx` for scripts

**Spec:** `docs/superpowers/specs/2026-03-21-nextjs-typescript-migration-design.md`

**IMPORTANT:** Do not modify or delete any files in `plantInventory/` or `plantInventoryServer/`. These are kept for reference.

---

## File Map

### New files to create:

| File | Responsibility |
|------|---------------|
| `package.json` | Root dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |
| `.env.local` | Local database connection string |
| `.gitignore` | Git ignore rules for Next.js project |
| `src/lib/types.ts` | Shared TypeScript type definitions |
| `src/lib/db/client.ts` | PostgreSQL connection pool |
| `src/lib/db/seed.ts` | Database seed script |
| `src/lib/db/categories.ts` | Category query functions |
| `src/lib/db/items.ts` | Plant/item query functions |
| `src/lib/db/orders.ts` | Order query functions |
| `src/lib/db/order-items.ts` | Order item query functions |
| `src/components/nav.tsx` | Shared navigation bar |
| `src/app/layout.tsx` | Root layout with nav and globals |
| `src/app/page.tsx` | Home page |
| `src/app/products/page.tsx` | Product list page |
| `src/app/products/[productId]/page.tsx` | Single product detail page |
| `src/app/products/[productId]/not-found.tsx` | 404 for missing products |
| `src/app/error.tsx` | Global error boundary |
| `src/app/api/orders/route.ts` | Orders API route handler |
| `src/app/api/order-items/route.ts` | Order items API route handler |

---

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `.env.local`, `.gitignore`

- [ ] **Step 1: Initialize Next.js with TypeScript**

```bash
cd /Users/jordanumlauf/plant-app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

The directory is not empty (contains `plantInventory/`, `plantInventoryServer/`, `docs/`, etc.). When prompted about the non-empty directory, accept/proceed. When prompted about overwriting `.gitignore`, accept. The scaffolder will create `package.json`, `tsconfig.json`, `next.config.ts`, and the `src/app/` directory with default files. Note: With Tailwind v4 (current default), configuration is CSS-based in `globals.css` rather than a separate `tailwind.config.ts` file.

Expected: Project scaffolded successfully. Existing `plantInventory/` and `plantInventoryServer/` directories are untouched.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install pg
npm install -D @types/pg tsx
```

- [ ] **Step 3: Create `.env.local`**

```bash
# /Users/jordanumlauf/plant-app/.env.local
DATABASE_URL=postgresql://jordo_drummer@localhost:5432/cactus_shop
```

- [ ] **Step 4: Add seed script to `package.json`**

Add to the `"scripts"` section:
```json
"seed": "npx tsx src/lib/db/seed.ts"
```

- [ ] **Step 5: Verify the app starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on `http://localhost:3000` with the default welcome page.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json .gitignore src/
git commit -m "scaffold Next.js project with TypeScript and Tailwind"
```

---

### Task 2: Initialize shadcn/ui

**Files:**
- Modify: `tailwind.config.ts`, `src/app/globals.css`
- Create: `components.json`, `src/lib/utils.ts`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

When prompted, select:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 2: Add Card and Button components**

```bash
npx shadcn@latest add card button
```

These will be used in the product list and detail pages.

- [ ] **Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "initialize shadcn/ui with Card and Button components"
```

---

### Task 3: Types and database client

**Files:**
- Create: `src/lib/types.ts`, `src/lib/db/client.ts`

- [ ] **Step 1: Create shared types**

```typescript
// src/lib/types.ts

export type Category = {
  id: number;
  name: string;
  price: number;
};

export type Plant = {
  id: number;
  cultivar_name: string;
  category_id: number;
  image: string;
  inventory: number;
  price: number;
  details: string | null;
  in_stock: boolean;
};

export type Customer = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
};

export type Order = {
  id: number;
  customer_id: number;
  created_on: Date;
  updated_on: Date;
  status: string;
};

export type OrderDetail = {
  id: number;
  order_id: number;
  plant_id: number;
  price_each: number;
  quantity: number;
};
```

- [ ] **Step 2: Create database client**

```typescript
// src/lib/db/client.ts
import { Pool } from "pg";

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "cactus_shop",
        user: process.env.DB_USER || "jordo_drummer",
        password: process.env.DB_PASS || "",
        port: Number(process.env.DB_PORT) || 5432,
      }
);

export default pool;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/db/client.ts
git commit -m "add TypeScript types and pg database client"
```

---

### Task 4: Database seed script

**Files:**
- Create: `src/lib/db/seed.ts`

Reference: `plantInventoryServer/db/seed.js` (read only, do not modify)

- [ ] **Step 1: Write the seed script**

```typescript
// src/lib/db/seed.ts
import pg from "pg";

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://jordo_drummer@localhost:5432/cactus_shop",
});

async function dropTables() {
  console.log("Dropping all tables...");
  await client.query(`
    DROP TABLE IF EXISTS order_details;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS plants;
    DROP TABLE IF EXISTS customers;
    DROP TABLE IF EXISTS categories;
  `);
  console.log("Finished dropping tables.");
}

async function createTables() {
  console.log("Creating tables...");

  await client.query(`
    CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      price INTEGER
    );
  `);

  await client.query(`
    CREATE TABLE plants (
      id SERIAL PRIMARY KEY,
      cultivar_name VARCHAR(50) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      image VARCHAR(250),
      inventory INTEGER DEFAULT 0,
      price INTEGER,
      details TEXT,
      in_stock BOOLEAN DEFAULT true
    );
  `);

  await client.query(`
    CREATE TABLE customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      address VARCHAR(50),
      city VARCHAR(50),
      state VARCHAR(50),
      zip VARCHAR(50),
      email VARCHAR(50)
    );
  `);

  await client.query(`
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id),
      created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending'
    );
  `);

  await client.query(`
    CREATE TABLE order_details (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      plant_id INTEGER REFERENCES plants(id),
      price_each INTEGER,
      quantity INTEGER
    );
  `);

  console.log("Finished creating tables.");
}

async function seedData() {
  console.log("Seeding sample data...");

  await client.query(`
    INSERT INTO categories (name, price) VALUES
      ('seeds', 5),
      ('cuts', 15),
      ('stands', 25);
  `);

  await client.query(`
    INSERT INTO plants (cultivar_name, category_id, image, inventory, price, details, in_stock) VALUES
      ('San Pedro', 1, '', 10, 5, 'Classic columnar cactus', true),
      ('Bridgesii', 1, '', 8, 7, 'Bolivian torch cactus', true),
      ('Peruvianus', 2, '', 5, 15, 'Peruvian apple cactus', true),
      ('Pachanoi', 2, '', 0, 20, 'Traditional medicinal cactus', false),
      ('Scopulicola', 3, '', 3, 25, 'Rare cliff-dwelling cactus', true);
  `);

  await client.query(`
    INSERT INTO customers (name, address, city, state, zip, email) VALUES
      ('Test Customer', '123 Main St', 'Denver', 'CO', '80202', 'test@example.com');
  `);

  console.log("Finished seeding data.");
}

async function rebuildDb() {
  try {
    await client.connect();
    await dropTables();
    await createTables();
    await seedData();
    console.log("Database rebuild complete.");
  } catch (error) {
    console.error("Error rebuilding database:", error);
    throw error;
  } finally {
    await client.end();
  }
}

rebuildDb();
```

- [ ] **Step 2: Ensure the `cactus_shop` database exists**

```bash
createdb cactus_shop 2>/dev/null || echo "Database already exists"
```

- [ ] **Step 3: Run the seed script**

```bash
npm run seed
```

Expected output:
```
Dropping all tables...
Finished dropping tables.
Creating tables...
Finished creating tables.
Seeding sample data...
Finished seeding data.
Database rebuild complete.
```

- [ ] **Step 4: Verify data was inserted**

```bash
psql cactus_shop -c "SELECT * FROM plants;"
```

Expected: 5 plant rows returned.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/seed.ts
git commit -m "add database seed script with sample plant data"
```

---

### Task 5: Database query functions

**Files:**
- Create: `src/lib/db/categories.ts`, `src/lib/db/items.ts`, `src/lib/db/orders.ts`, `src/lib/db/order-items.ts`

Reference: `plantInventoryServer/db/*.js` files (read only, do not modify)

- [ ] **Step 1: Create category query functions**

```typescript
// src/lib/db/categories.ts
import pool from "./client";
import { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query("SELECT * FROM categories");
  return rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createCategory(name: string, price: number): Promise<Category> {
  const { rows } = await pool.query(
    "INSERT INTO categories (name, price) VALUES ($1, $2) RETURNING *",
    [name, price]
  );
  return rows[0];
}
```

- [ ] **Step 2: Create item/plant query functions**

```typescript
// src/lib/db/items.ts
import pool from "./client";
import { Plant } from "../types";

export async function getItems(): Promise<Plant[]> {
  const { rows } = await pool.query("SELECT * FROM plants");
  return rows;
}

export async function getItemById(id: number): Promise<Plant | null> {
  const { rows } = await pool.query("SELECT * FROM plants WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createItem(item: Omit<Plant, "id">): Promise<Plant> {
  const { rows } = await pool.query(
    `INSERT INTO plants (cultivar_name, category_id, image, inventory, price, details, in_stock)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [item.cultivar_name, item.category_id, item.image, item.inventory, item.price, item.details, item.in_stock]
  );
  return rows[0];
}

export async function updateItem(id: number, fields: Partial<Omit<Plant, "id">>): Promise<Plant | null> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getItemById(id);

  const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(", ");
  const values = entries.map(([, v]) => v);

  const { rows } = await pool.query(
    `UPDATE plants SET ${setClauses} WHERE id = $${entries.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] || null;
}

export async function deleteItem(id: number): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM plants WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
```

- [ ] **Step 3: Create order query functions**

```typescript
// src/lib/db/orders.ts
import pool from "./client";
import { Order } from "../types";

export async function getOrders(): Promise<Order[]> {
  const { rows } = await pool.query("SELECT * FROM orders");
  return rows;
}

export async function getOrderById(id: number): Promise<Order | null> {
  const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createOrder(customerId: number): Promise<Order> {
  const { rows } = await pool.query(
    "INSERT INTO orders (customer_id) VALUES ($1) RETURNING *",
    [customerId]
  );
  return rows[0];
}

export async function updateOrderStatus(id: number, status: string): Promise<Order | null> {
  const { rows } = await pool.query(
    "UPDATE orders SET status = $1, updated_on = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id]
  );
  return rows[0] || null;
}

export async function deleteOrder(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "UPDATE orders SET status = 'deleted', updated_on = CURRENT_TIMESTAMP WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
```

- [ ] **Step 4: Create order item query functions**

```typescript
// src/lib/db/order-items.ts
import pool from "./client";
import { OrderDetail } from "../types";

export async function getOrderItems(orderId: number): Promise<OrderDetail[]> {
  const { rows } = await pool.query(
    "SELECT * FROM order_details WHERE order_id = $1",
    [orderId]
  );
  return rows;
}

export async function createOrderItem(
  orderId: number,
  plantId: number,
  priceEach: number,
  quantity: number
): Promise<OrderDetail> {
  const { rows } = await pool.query(
    `INSERT INTO order_details (order_id, plant_id, price_each, quantity)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId, plantId, priceEach, quantity]
  );
  return rows[0];
}

export async function deleteOrderItem(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM order_details WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/categories.ts src/lib/db/items.ts src/lib/db/orders.ts src/lib/db/order-items.ts
git commit -m "add typed database query functions for all entities"
```

---

### Task 6: Navigation component and root layout

**Files:**
- Create: `src/components/nav.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Create the navigation component**

```tsx
// src/components/nav.tsx
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Cactus Shop
        </Link>
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
          Products
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update root layout**

Replace the contents of `src/app/layout.tsx`:

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cactus Shop",
  description: "Plant inventory management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Nav />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the app renders**

```bash
npm run dev
```

Visit `http://localhost:3000`. Expected: Page loads with "Cactus Shop" nav bar and default content.

- [ ] **Step 4: Commit**

```bash
git add src/components/nav.tsx src/app/layout.tsx src/app/globals.css
git commit -m "add navigation component and root layout"
```

---

### Task 7: Home page

**Files:**
- Modify: `src/app/page.tsx`

Reference: `plantInventory/src/components/Home.jsx` (read only)

- [ ] **Step 1: Replace default home page**

```tsx
// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <h1 className="text-4xl font-bold">Welcome to the Cactus Shop</h1>
      <p className="text-muted-foreground text-lg">
        Browse our plant inventory
      </p>
      <Button asChild>
        <Link href="/products">View Products</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

```bash
npm run dev
```

Visit `http://localhost:3000`. Expected: Welcome page with heading and "View Products" button that links to `/products`.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "add home page"
```

---

### Task 8: Product list page

**Files:**
- Modify: `src/app/products/page.tsx`

Reference: `plantInventory/src/components/ProductList.jsx` (read only)

- [ ] **Step 1: Create the products directory and page**

```tsx
// src/app/products/page.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getItems } from "@/lib/db/items";

export default async function ProductsPage() {
  const plants = await getItems();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <Card key={plant.id}>
            <CardHeader>
              <CardTitle>{plant.cultivar_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{plant.details}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold">${plant.price}</span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/products/${plant.id}`}>Details</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders with database data**

```bash
npm run dev
```

Visit `http://localhost:3000/products`. Expected: Grid of 5 plant cards from the seeded database, each with name, details, price, and a "Details" link.

- [ ] **Step 3: Commit**

```bash
git add src/app/products/page.tsx
git commit -m "add product list page with server-side data fetching"
```

---

### Task 9: Single product page with not-found

**Files:**
- Create: `src/app/products/[productId]/page.tsx`, `src/app/products/[productId]/not-found.tsx`

Reference: `plantInventory/src/components/SingleProduct.jsx` (read only)

- [ ] **Step 1: Create the single product page**

```tsx
// src/app/products/[productId]/page.tsx
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemById } from "@/lib/db/items";
import { getCategoryById } from "@/lib/db/categories";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));
  if (!plant) return { title: "Product Not Found" };
  return { title: `${plant.cultivar_name} | Cactus Shop` };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));

  if (!plant) {
    notFound();
  }

  const category = await getCategoryById(plant.category_id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">{plant.cultivar_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {category && (
          <p className="text-sm text-muted-foreground">
            Category: {category.name}
          </p>
        )}
        <p>{plant.details}</p>
        <div className="flex gap-4">
          <span className="font-semibold text-lg">${plant.price}</span>
          <span className={plant.in_stock ? "text-green-600" : "text-red-500"}>
            {plant.in_stock ? `In stock (${plant.inventory})` : "Out of stock"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create the not-found page**

```tsx
// src/app/products/[productId]/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <h1 className="text-2xl font-bold">Product Not Found</h1>
      <p className="text-muted-foreground">
        The product you are looking for does not exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/products">Back to Products</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify the page renders**

```bash
npm run dev
```

Visit `http://localhost:3000/products/1`. Expected: Plant detail card with name, category, details, price, stock status.

Visit `http://localhost:3000/products/999`. Expected: "Product Not Found" page with back link.

- [ ] **Step 4: Commit**

```bash
git add src/app/products/\[productId\]/
git commit -m "add single product page with not-found handling"
```

---

### Task 10: Error boundary

**Files:**
- Create: `src/app/error.tsx`

- [ ] **Step 1: Create the error boundary**

```tsx
// src/app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/error.tsx
git commit -m "add global error boundary"
```

---

### Task 11: API routes for orders

**Files:**
- Create: `src/app/api/orders/route.ts`

Reference: `plantInventoryServer/routes/orders.js` (read only)

- [ ] **Step 1: Create the orders route handler**

```typescript
// src/app/api/orders/route.ts
import { NextResponse } from "next/server";
import { getOrders, getOrderById, createOrder, updateOrderStatus, deleteOrder } from "@/lib/db/orders";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const order = await getOrderById(Number(id));
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id } = body;

    if (!customer_id) {
      return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
    }

    const order = await createOrder(customer_id);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const order = await updateOrderStatus(id, status);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await deleteOrder(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test the orders API**

```bash
# Create an order
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"customer_id": 1}'

# List orders
curl http://localhost:3000/api/orders
```

Expected: POST returns a new order with status 201. GET returns an array including that order.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "add orders API route handler"
```

---

### Task 12: API routes for order items

**Files:**
- Create: `src/app/api/order-items/route.ts`

Reference: `plantInventoryServer/routes/orderItems.js` (read only)

- [ ] **Step 1: Create the order items route handler**

```typescript
// src/app/api/order-items/route.ts
import { NextResponse } from "next/server";
import { getOrderItems, createOrderItem, deleteOrderItem } from "@/lib/db/order-items";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const items = await getOrderItems(Number(orderId));
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, plant_id, price_each, quantity } = body;

    if (!order_id || !plant_id || !price_each || !quantity) {
      return NextResponse.json(
        { error: "order_id, plant_id, price_each, and quantity are required" },
        { status: 400 }
      );
    }

    const item = await createOrderItem(order_id, plant_id, price_each, quantity);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await deleteOrderItem(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Verify full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/order-items/route.ts
git commit -m "add order items API route handler"
```

---

### Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Replace CLAUDE.md with updated content**

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev       # Start Next.js dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
npm run seed      # Seed the PostgreSQL database
```

## Architecture

Next.js 15 App Router with TypeScript. Single project at repo root.

**Frontend:** Server components fetch data directly from PostgreSQL — no client-side fetch pattern. UI built with shadcn/ui + Tailwind CSS. Interactive elements use `"use client"` components.

**Data layer:** Raw SQL via `pg` Pool (`src/lib/db/client.ts`). Query functions in `src/lib/db/*.ts` return typed results. Types defined in `src/lib/types.ts`.

**API routes:** `src/app/api/orders/route.ts` and `src/app/api/order-items/route.ts` handle mutations. Categories and plants are queried directly in server components.

**Database:** PostgreSQL database `cactus_shop`. Tables: `categories`, `plants`, `customers`, `orders`, `order_details`. Connection via `DATABASE_URL` env var with fallback to individual `DB_*` vars.

## Legacy Reference

`plantInventory/` (old React+Vite frontend) and `plantInventoryServer/` (old Express backend) are kept for reference. Do not modify or delete them.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "update CLAUDE.md for Next.js migration"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run the full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start the dev server and test all pages**

```bash
npm run dev
```

Test manually:
- `http://localhost:3000` — Home page renders
- `http://localhost:3000/products` — Product list shows 5 plants from DB
- `http://localhost:3000/products/1` — Single product detail page
- `http://localhost:3000/products/999` — Not found page

- [ ] **Step 3: Test API routes**

```bash
curl http://localhost:3000/api/orders
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"customer_id": 1}'
```

Expected: Both return valid JSON responses.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 5: Final commit if any cleanup was needed**

Only commit if there are actual changes. Use targeted file additions:

```bash
git add src/ package.json CLAUDE.md
git commit -m "final cleanup after Next.js migration"
```
