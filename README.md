# Rare Cactus and Succulent Inventory

> Full-stack plant inventory and e-commerce application built with Next.js, TypeScript, and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)

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
- **Shopping cart** with localStorage persistence across sessions
- **Image uploads** via Vercel Blob storage
- **Order management** API with full CRUD operations
- **Responsive UI** built with shadcn/ui components
- **Type-safe database layer** using raw SQL with PostgreSQL

---

## For Customers

### Browsing Products

Visit the site and you'll see a grid of available plants. Each card shows the plant name, description, and price. Click **Details** to view the full product page with stock status, category, and inventory count.

### Shopping Cart

- Click **Add to Cart** on any product detail page
- Visit the **Cart** page from the navigation bar to view your items
- Adjust quantities or remove items directly in the cart
- Your cart total updates automatically
- Your cart is saved in your browser. It persists even if you close the tab and come back

### Coming Soon

- Checkout with Stripe payments
- Order tracking and history
- User accounts

---

## For Admins / Business Operators

### Managing Inventory

The database comes pre-loaded with sample plant data. To reset and re-seed:

```bash
npm run seed
```

> **Warning:** This is a destructive operation. It drops all tables and recreates them with sample data.

**Plant data model:**

| Field | Description |
|-------|-------------|
| `cultivar_name` | Name of the plant cultivar |
| `category_id` | Category (seeds, cuts, stands) |
| `price` | Price in whole dollars |
| `inventory` | Number of units in stock |
| `in_stock` | Whether the item is available |
| `details` | Description of the plant |
| `image` | URL to the plant image |

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

Use the variant note field to set expectations for customers. Here are suggested wordings:

- **Cut to order:** "The cut you get will be taken from the same part of the plant as pictured."
- **Cut to Order, Inventory listing (multiple in stock):** "Tips to be cut upon purchase. Inventory listing, so you will likely not receive the exact cut shown here."
- **Pre-cut:** "The cut you get will be the same piece as pictured."
- **Pre-cut, Inventory listing (multiple in stock):** "Inventory listing, so you will likely not receive the exact cut shown here."


**Provenance:**

Include lineage and origin information in the product description (details field). This is free-text to handle partial information. Example: "Mother: Lumberjack x Father: Ogun. Sourced from Sacred Succulents, California."

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

On any product detail page, use the **Upload Image** button to add a photo. Select a file and it will be uploaded to Vercel Blob storage and automatically displayed on the product card and detail page.

> **Note:** Image upload is currently accessible to all users. It will be restricted to admin-only once authentication is implemented.

### Managing Orders

Orders are managed through the API (an admin portal UI is planned):

- **Create** an order for a customer
- **Update status** through the workflow: `pending` → `processing` → `shipped` → `delivered`
- **Soft-delete** orders (sets status to `deleted` rather than removing the record)

See the [API Reference](#api-reference) below for endpoint details.

### Database Access

Connect directly to inspect or modify data:

```bash
psql cactus_shop
```

**Tables:**

| Table | Description |
|-------|-------------|
| `categories` | Product categories (seeds, cuts, stands) |
| `plants` | Plant inventory items |
| `customers` | Customer records |
| `orders` | Order records with status tracking |
| `order_details` | Line items within orders |

---

## For Developers

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm
- [PostgreSQL](https://www.postgresql.org/)

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/jordodrummer/plant-app.git
cd plant-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Create the database**

```bash
createdb cactus_shop
```

4. **Set up environment variables**

Create a `.env.local` file in the project root:

```
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/cactus_shop
```

5. **Seed the database**

```bash
npm run seed
```

6. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes (or use fallbacks) | | PostgreSQL connection string |
| `DB_HOST` | No | `localhost` | Database host (fallback) |
| `DB_NAME` | No | `cactus_shop` | Database name (fallback) |
| `DB_USER` | No | `your_pg_username` | Database user (fallback) |
| `DB_PASS` | No | `""` | Database password (fallback) |
| `DB_PORT` | No | `5432` | Database port (fallback) |
| `BLOB_READ_WRITE_TOKEN` | For image uploads | | Vercel Blob storage token (required in production) |

### Project Structure

```
src/
├── app/                        # Pages and API routes (file-based routing)
│   ├── layout.tsx              # Root layout with nav and CartProvider
│   ├── page.tsx                # Home page
│   ├── error.tsx               # Global error boundary
│   ├── products/
│   │   ├── page.tsx            # Product list (server component)
│   │   └── [productId]/
│   │       ├── page.tsx        # Product detail (server component)
│   │       └── not-found.tsx   # 404 for invalid products
│   ├── cart/
│   │   └── page.tsx            # Shopping cart page
│   └── api/
│       ├── orders/route.ts     # Orders CRUD
│       ├── order-items/route.ts # Order items CRUD
│       └── upload/route.ts     # Image upload
├── components/
│   ├── ui/                     # shadcn/ui components (Button, Card)
│   ├── nav.tsx                 # Navigation bar
│   ├── footer.tsx              # Footer
│   ├── cart-icon.tsx           # Cart badge in nav
│   ├── add-to-cart-button.tsx  # Add to Cart button
│   └── image-upload.tsx        # Image upload component
└── lib/
    ├── types.ts                # TypeScript type definitions
    ├── cart-context.tsx         # Cart state with localStorage
    ├── utils.ts                # Utility functions (cn)
    └── db/
        ├── client.ts           # PostgreSQL connection pool
        ├── seed.ts             # Database seed script
        ├── categories.ts       # Category queries
        ├── items.ts            # Plant/item queries
        ├── orders.ts           # Order queries
        └── order-items.ts      # Order item queries
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [PostgreSQL](https://www.postgresql.org/) | Database (via `pg`) |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | Image storage |

### API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | `GET` | List all orders, or single order with `?id=` |
| `/api/orders` | `POST` | Create order. Body: `{ customer_id }` |
| `/api/orders` | `PUT` | Update order status. Body: `{ id, status }` |
| `/api/orders` | `DELETE` | Soft-delete order with `?id=` |
| `/api/order-items` | `GET` | List items for an order with `?order_id=` |
| `/api/order-items` | `POST` | Add item. Body: `{ order_id, plant_id, price_each, quantity }` |
| `/api/order-items` | `DELETE` | Remove item with `?id=` |
| `/api/upload` | `POST` | Upload image. FormData with `file` and `plant_id` fields |

### Deployment

**Recommended: [Vercel](https://vercel.com/)**

1. Push your repo to GitHub
2. Import the project in Vercel
3. Set environment variables:
   - `DATABASE_URL` - use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) for production (provides auto-backups, SSL, and connection pooling)
   - `BLOB_READ_WRITE_TOKEN` - generated in Vercel Blob storage settings

The app will build and deploy automatically on every push.

---

## License

TBD
