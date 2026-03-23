# README Design Spec

## Overview

Create a comprehensive `README.md` for the Rare Cactus and Succulent Inventory app. Single file with a table of contents, organized by audience: customers, business operators/admins, and developers.

## Brand

- **Name:** Rare Cactus and Succulent Inventory
- **Current working name in code:** Cactus Shop (used in nav, metadata — can be updated separately)

## Structure

### Header
- Project name and one-line description
- Tech stack badges (Next.js, TypeScript, PostgreSQL, Tailwind CSS, Vercel)
- Table of contents linking to all major sections

### Features
Brief bullet list of current capabilities:
- Product browsing with server-side rendering
- Shopping cart with localStorage persistence
- Image uploads via Vercel Blob
- Order management API
- Responsive UI with shadcn/ui components
- Type-safe PostgreSQL database layer

### For Customers
- **Browsing Products** — visit the site, view the product grid, click Details for full product info (price, stock status, description, category)
- **Shopping Cart** — add items, adjust quantities, view totals. Cart persists across page refreshes via localStorage
- **Coming Soon** — note that checkout/payments (Stripe) is planned

### For Admins / Business Operators
- **Managing Inventory** — how to seed the database (`npm run seed` — warning: this is destructive, drops and recreates all tables), overview of plant data model (cultivar name, category, price, inventory count, in-stock status)
- **Uploading Images** — use the upload button on product detail pages. Note: currently accessible to all users, will be restricted to admin-only once auth is implemented
- **Managing Orders** — overview of orders API: create orders, update status (pending → processing → shipped → delivered), soft-delete. Mention that an admin portal UI is planned
- **Database Access** — connect to PostgreSQL via `psql`, what tables exist (categories, plants, customers, orders, order_details), how to re-seed

### For Developers

- **Prerequisites** — Node.js (v18+), npm, PostgreSQL
- **Getting Started** — step-by-step: clone, `npm install`, create `.env.local`, `npm run seed`, `npm run dev`
- **Environment Variables** — `DATABASE_URL` as primary, with fallback vars (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`) and their defaults. Also `BLOB_READ_WRITE_TOKEN` (required for Vercel Blob image uploads in production)
- **Project Structure** — overview of directory layout:
  - `src/app/` — pages and API routes (file-based routing)
  - `src/components/` — UI components (shadcn/ui) and feature components (nav, cart, image upload)
  - `src/lib/` — types, database query functions, cart context, utilities
- **Tech Stack** — Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, PostgreSQL via `pg`, Vercel Blob for image storage
- **API Reference** — table format:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | List all orders (or single by `?id=`) |
| `/api/orders` | POST | Create order (`{ customer_id }`) |
| `/api/orders` | PUT | Update order status (`{ id, status }`) |
| `/api/orders` | DELETE | Soft-delete order (`?id=`) |
| `/api/order-items` | GET | List items for order (`?order_id=`) |
| `/api/order-items` | POST | Add item (`{ order_id, plant_id, price_each, quantity }`) |
| `/api/order-items` | DELETE | Remove item (`?id=`) |
| `/api/upload` | POST | Upload image (FormData with `file` and `plant_id` fields) |

- **Deployment** — Vercel recommended. Set `DATABASE_URL` in Vercel environment variables. For production, recommend Vercel Postgres (auto-backups, SSL, connection pooling). Configure Vercel Blob for image storage.
- **Legacy Reference** — `plantInventory/` and `plantInventoryServer/` are the original React+Vite and Express codebase, kept for reference. Do not modify.

### License
Placeholder — user to decide on license later.
