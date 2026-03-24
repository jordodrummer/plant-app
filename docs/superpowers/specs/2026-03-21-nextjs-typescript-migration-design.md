# Next.j     + TypeScript Migration Design

## Overview

Migrate the plant inventory app from two separate projects (React + Vite frontend, Express + PostgreSQL backend) into a single Next.js App Router application with TypeScript, shadcn/ui + Tailwind CSS, and raw `pg` for database access. Deploy target: Vercel.

## Approach

Fresh Next.js project at the repo root (Approach A). The app is early-stage with 3 frontend components, stub DB functions, and a seed script — a clean start is faster and less error-prone than in-place migration.

## Project Structure

```
plant-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, globals, nav shell)
│   │   ├── page.tsx                # Home page
│   │   ├── products/
│   │   │   ├── page.tsx            # Product list
│   │   │   └── [productId]/
│   │   │       └── page.tsx        # Single product detail
│   │   └── api/
│   │       ├── orders/
│   │       │   └── route.ts        # Orders CRUD
│   │       └── order-items/
│   │           └── route.ts        # Order items CRUD
│   ├── components/
│   │   └── ui/                     # shadcn/ui components (added as needed)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts           # pg Pool configuration
│   │   │   ├── seed.ts             # Database seed script
│   │   │   ├── categories.ts       # Category query functions
│   │   │   ├── items.ts            # Item/plant query functions
│   │   │   ├── orders.ts           # Order query functions
│   │   │   └── order-items.ts      # Order item query functions
│   │   └── types.ts                # Shared TypeScript types
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
└── .env.local                      # Local DB connection (gitignored)
```

Old directories `plantInventory/` and `plantInventoryServer/` are kept in place for reference. Do not modify or delete them.

## Types

The schema is being cleaned up from the original (fixing naming conventions to snake_case, fixing SQL syntax errors, adding missing columns from the Item comment block in `Items.js`). The seed script will create a new schema rather than replicate the old one. Types reflect the redesigned schema:

```typescript
type Category = {
  id: number
  name: string        // was "categoryName"
  price: number       // kept from original
}

type Plant = {
  id: number
  cultivar_name: string   // was "cultivarName"
  category_id: number     // was "categoryId"
  image: string
  inventory: number
  price: number           // from Item comment block
  details: string | null  // from Item comment block
  in_stock: boolean       // from Item comment block (was string)
}

type Customer = {
  id: number
  name: string
  address: string
  city: string
  state: string
  zip: string
  email: string
}

type Order = {
  id: number
  customer_id: number    // was "customerId"
  created_on: Date       // was "createdOn"
  updated_on: Date       // was "updatedOn"
  status: string
}

type OrderDetail = {
  id: number
  order_id: number       // was "orderId"
  plant_id: number       // was "plantId"
  price_each: number     // was "priceEach"
  quantity: number
}
```

## Data Layer

- **Database client** (`lib/db/client.ts`): `pg` Pool reading from `DATABASE_URL` env var (Vercel convention) with fallback to individual `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PORT` vars.
- **Query functions** (`lib/db/*.ts`): Typed wrappers around raw SQL. Each returns typed results (e.g., `getOrders(): Promise<Order[]>`).
- **Seed script**: Run via `npx tsx src/lib/db/seed.ts`. Creates tables (`categories`, `plants`, `customers`, `orders`, `order_details`) and inserts sample data.

## Frontend

- **All pages are server components** by default. Data fetching happens on the server with direct DB queries — no `useState`/`useEffect` fetch pattern.
- **Home page** (`app/page.tsx`): Static welcome content, ported from `Home.jsx`.
- **Product list** (`app/products/page.tsx`): Fetches plants from the database directly (replaces fakestoreapi.com mock).
- **Single product** (`app/products/[productId]/page.tsx`): Dynamic route, queries single plant by ID. Includes `generateMetadata` for SEO.
- **Interactive elements** (e.g., future add-to-cart) will be extracted into `"use client"` components as needed.
- **UI**: shadcn/ui + Tailwind CSS. Components added incrementally via `npx shadcn@latest add <component>`.
- **Navigation**: Root layout includes a shared nav component (`src/components/nav.tsx`) with links to Home and Products.
- **Error handling**: Next.js `error.tsx` boundaries for page-level errors, `not-found.tsx` for missing products. API route handlers use try/catch returning appropriate status codes.

## API Routes

Next.js Route Handlers with exported `GET`/`POST`/`PUT`/`DELETE` functions:

- `app/api/orders/route.ts` — Orders CRUD (ported from Express `routes/orders.js`)
- `app/api/order-items/route.ts` — Order items CRUD (ported from Express `routes/orderItems.js`)

No Express, CORS middleware, or Morgan needed. CORS configured only if external API access is required later.

Categories and plants are queried directly in server components and do not need API routes initially. Customer management is deferred — no API route or UI for it yet.

## Environment

`.env.local` (gitignored by Next.js default):
```
DATABASE_URL=postgresql://jordo_drummer@localhost:5432/cactus_shop
```

## Key Dependencies

- `next`, `react`, `react-dom` — framework
- `typescript`, `@types/react`, `@types/node` — type system
- `tailwindcss`, `@tailwindcss/postcss` — styling
- `pg`, `@types/pg` — database
- `tsx` — running TypeScript seed script directly

## What's Removed

- Vite, `@vitejs/plugin-react`, `.eslintrc.cjs` (Next.js has built-in ESLint config)
- Express, CORS, Morgan, Nodemon
- MUI and Emotion packages
- React Router (replaced by file-based routing)
- fakestoreapi.com dependency (replaced by real DB queries)

Note: The old `plantInventory/` and `plantInventoryServer/` directories remain untouched for reference.
