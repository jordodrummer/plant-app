# Rare Succulent Inventory

> Full-stack plant inventory and e-commerce application built with Next.js, TypeScript, Supabase, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)

**[Live Site](https://raresucculentinventory.com)** | **[Project Board](https://github.com/users/jordodrummer/projects/5)**

## Table of Contents

- [Features](#features)
- [For Customers](#for-customers)
- [For Admins / Business Operators](#for-admins--business-operators)
- [For Developers](#for-developers)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Project Structure](#project-structure)
  - [Tech Stack](#tech-stack)
  - [API Reference](#api-reference)
  - [Deployment](#deployment)
- [License](#license)

---

## Features

- **Product browsing** with server-side rendering for fast page loads
- **Multi-variant products** (cuttings, cut-to-order, mother stands, seeds) with per-variant pricing and inventory
- **Multi-image gallery** with labeled photos (plant, mother, father, cutting, grown example)
- **Shopping cart** with localStorage persistence and inventory enforcement
- **Image uploads** via Vercel Blob storage with type and caption metadata
- **Authentication** with email/password via Supabase Auth
- **Role-based access control** (admin vs customer) on all API routes
- **Order management** API with full CRUD operations
- **Responsive UI** built with shadcn/ui components
- **Deployed** on Vercel with Cloudflare DNS and SSL

---

## For Customers

### Browsing Products

Visit the site and you'll see a grid of available plants. Each card shows the plant name, description, and starting price. Click the card to view the full product page with image gallery, variant options, stock status, and provenance details.

### Shopping Cart

- Choose a variant (cutting, mother stand, seeds, etc.) and quantity on the product detail page
- Visit the **Cart** page from the navigation bar to view your items
- Adjust quantities or remove items directly in the cart
- Quantities are capped at available inventory
- Your cart is saved in your browser and persists across page refreshes

### Account

- Click **Sign In** in the navigation bar to create an account or sign in
- Accounts are required for checkout (coming soon)

### Coming Soon

- Checkout with Stripe payments
- Order tracking and history
- Google OAuth sign-in

---

## For Admins / Business Operators

### Managing Inventory

The database is hosted on Supabase. Use the [Supabase dashboard](https://supabase.com/dashboard) to manage data directly, or use the seed script for development:

```bash
npm run seed
```

> **Warning:** The seed script is destructive. It drops all tables and recreates them with sample data. Only use for development.

**Plant data model:**

Each plant has a `cultivar_name`, `category_id`, `details` (free-text provenance), and an `in_stock` flag. Pricing and inventory live on **variants**, not the plant itself.

### Product Types and Listing Guidelines

Each product page represents one cultivar, hybrid, or seed lot. Products can have multiple purchasable variants on the same page.

**Variant types:**

| Type | Description |
|------|-------------|
| **Cutting** | A pre-cut piece from a mother stand, ready to ship |
| **Rooted Cutting** | A pre-cut piece from a mother stand, which already has roots, ready to ship |
| **Cut to Order** | Cut from the mother stand after payment is received. Allow 7-10 days for cut-to-order listings to callous before shipment |
| **Mother Stand** | The whole rooted plant that cuttings are taken from |
| **Seedling** | The whole rooted plant that grew from a seed |
| **OP Seeds** | Open pollinated seeds (mother cultivar OP), sold in packs |
| **Hybrid Seeds** | Cross-pollinated seeds (mother x father), sold in packs |

**Recommended variant notes:**

Use the variant note field to set expectations for customers:

- **Cut to order:** "The cut you get will be taken from the same part of the plant as pictured."
- **Cut to Order, Inventory listing (multiple in stock):** "Tips to be cut upon purchase. Inventory listing, so you will likely not receive the exact cut shown here."
- **Pre-cut:** "The cut you get will be the same piece as pictured."
- **Pre-cut, Inventory listing (multiple in stock):** "Inventory listing, so you will likely not receive the exact cut shown here."

**Provenance:**

Include lineage and origin information in the product description (details field). This is free-text to handle partial information. Example: "Mother: Blizzard x Father: Firebird. Sourced from Magical Succulents, Nevada."

**Image types:**

When uploading images, label them appropriately:

| Label | Use for |
|-------|---------|
| Plant | General photo of the cultivar |
| Mother | Photo of the mother stand |
| Father | Photo of the father plant (for hybrids/seeds) |
| Cutting | Photo of an individual cut |
| Grown Example | Photo of a seedling that was grown from the seeds |

### Uploading Images

On any product detail page, use the **Upload Image** button to select an image type, add an optional caption, and upload. Images are stored in Vercel Blob and displayed in the product gallery.

> **Note:** Image upload is restricted to admin users only.

### Seed Data Spreadsheet Format

To prepare plant data in a Google Sheet for bulk import, use one row per variant:

| cultivar_name | category | details | variant_type | price | inventory | label | note |
|---|---|---|---|---|---|---|---|
| Echeveria Lola | Succulent | Pale purple rosette. Sourced from Korean nursery. | cutting | 15 | 8 | | The cut you see here is the cut you get. |
| Echeveria Lola | Succulent | Pale purple rosette. Sourced from Korean nursery. | mother_stand | 45 | 1 | | |
| Golden Barrel | Cactus | Round cactus with golden spines. Mother: Wild collected Baja California. | op_seeds | 8 | 20 | Pack of 100 | |
| Burro's Tail | Cactus | Trailing succulent. Mother: S. morganianum x Father: S. burrito. | hybrid_seeds | 12 | 10 | Pack of 50 | |

Repeat the cultivar name, category, and details on each row. Rows with the same cultivar name will be grouped into one plant with multiple variants during import.

**Valid variant_type values:** `cutting`, `rooted_cutting`, `cut_to_order`, `mother_stand`, `seedling`, `op_seeds`, `hybrid_seeds`

### Managing Orders

Orders are managed through the admin portal at `/admin/orders`. All order endpoints require admin authentication.

- View all orders with status badges and totals
- Click into an order to see customer info and line items
- Update status through the workflow: `pending` → `confirmed` → `shipped` → `delivered`
- Soft-delete orders (sets status to `deleted` rather than removing the record)

### Database Access

Data is hosted on Supabase PostgreSQL. Use the Supabase dashboard SQL editor or Table editor to inspect and modify data.

**Tables:**

| Table | Description |
|-------|-------------|
| `categories` | Product categories (e.g., Cactus, Succulent) |
| `plants` | Plant cultivars with provenance details |
| `plant_variants` | Purchasable options per plant (type, price, inventory) |
| `plant_images` | Gallery images with type labels and captions |
| `customers` | Customer records |
| `orders` | Order records with status tracking |
| `order_details` | Line items within orders (tracks variant_id) |

---

## For Developers

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm
- A [Supabase](https://supabase.com/) project (free tier works)

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/jordodrummer/rare-succulent-inventory.git
cd rare-succulent-inventory
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ADMIN_EMAIL=your-email@example.com
```

4. **Create tables in Supabase**

Run the SQL from `src/lib/db/seed.ts` in your Supabase SQL editor to create the schema and seed sample data.

5. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase publishable anon key |
| `ADMIN_EMAIL` | Yes | Email address for the admin user (server-only) |
| `BLOB_READ_WRITE_TOKEN` | For image uploads | Vercel Blob storage token (required in production) |

### Project Structure

```
src/
├── app/                        # Pages and API routes (file-based routing)
│   ├── layout.tsx              # Root layout with nav, footer, CartProvider
│   ├── page.tsx                # Home page with hero and featured plants
│   ├── error.tsx               # Global error boundary
│   ├── auth/
│   │   ├── sign-in/page.tsx    # Sign-in page (email/password)
│   │   ├── sign-up/page.tsx    # Sign-up page
│   │   └── callback/route.ts   # OAuth callback handler
│   ├── products/
│   │   ├── page.tsx            # Product list (server component)
│   │   └── [productId]/
│   │       ├── page.tsx        # Product detail with gallery and variants
│   │       └── not-found.tsx   # 404 for invalid products
│   ├── cart/
│   │   └── page.tsx            # Shopping cart page
│   └── api/
│       ├── orders/route.ts     # Orders CRUD (admin-only)
│       ├── order-items/route.ts # Order items CRUD (auth required)
│       └── upload/route.ts     # Image upload (admin-only)
├── components/
│   ├── ui/                     # shadcn/ui components (Button, Card)
│   ├── nav.tsx                 # Navigation bar
│   ├── footer.tsx              # Footer
│   ├── auth-button.tsx         # Sign In / Sign Out button
│   ├── cart-icon.tsx           # Cart badge in nav
│   ├── image-gallery.tsx       # Multi-image gallery with type badges
│   ├── variant-selector.tsx    # Variant list with add-to-cart
│   ├── image-upload.tsx        # Image upload with type/caption
│   └── plant-placeholder.tsx   # SVG placeholder for missing images
├── lib/
│   ├── types.ts                # TypeScript type definitions
│   ├── cart-context.tsx         # Cart state with localStorage
│   ├── utils.ts                # Utility functions (cn)
│   ├── supabase/
│   │   ├── server.ts           # Supabase server client (data + auth)
│   │   ├── client.ts           # Supabase browser client
│   │   └── middleware.ts       # Session refresh helper
│   └── db/
│       ├── seed.ts             # Database seed script
│       ├── categories.ts       # Category queries
│       ├── items.ts            # Plant/item queries (with variant joins)
│       ├── variants.ts         # Variant queries
│       ├── images.ts           # Image queries
│       ├── orders.ts           # Order queries
│       └── order-items.ts      # Order item queries
└── middleware.ts               # Next.js middleware (auth session refresh)
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Supabase](https://supabase.com/) | PostgreSQL database and authentication |
| [Vercel](https://vercel.com/) | Hosting and deployment |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Image storage |
| [Cloudflare](https://cloudflare.com/) | Domain, DNS, and SSL |

### API Reference

All mutation endpoints require authentication. Admin-only endpoints are marked.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/orders` | `GET` | Admin | List all orders, or single order with `?id=` |
| `/api/orders` | `POST` | Signed in | Create order. Body: `{ customer_id }` |
| `/api/orders` | `PUT` | Admin | Update order status. Body: `{ id, status }` |
| `/api/orders` | `DELETE` | Admin | Soft-delete order with `?id=` |
| `/api/order-items` | `GET` | Admin | List items for an order with `?order_id=` |
| `/api/order-items` | `POST` | Signed in | Add item. Body: `{ order_id, plant_id, variant_id, price_each, quantity }` |
| `/api/order-items` | `DELETE` | Admin | Remove item with `?id=` |
| `/api/upload` | `POST` | Admin | Upload image. FormData with `file`, `plant_id`, `image_type`, `caption` |

### Deployment

**Production: [Vercel](https://vercel.com/) + [Supabase](https://supabase.com/) + [Cloudflare](https://cloudflare.com/)**

1. Create a Supabase project and run the schema SQL
2. Import the repo in Vercel
3. Set environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_EMAIL`
   - `BLOB_READ_WRITE_TOKEN` (from Vercel Blob settings)
4. Configure your domain in Cloudflare DNS (A record to Vercel IP, CNAME for www)
5. Add the domain in Vercel project settings

The app auto-deploys on every push to master.

---

## License

TBD
