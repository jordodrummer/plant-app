# Product Variants and Image Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-variant products (cuttings, cut-to-order, mother stands, seed packs) and a multi-image gallery to the plant inventory app.

**Architecture:** New `plant_variants` and `plant_images` tables normalize pricing/inventory and photos away from the `plants` table. The product detail page becomes a server component that fetches plant, variants, and images in parallel, passing data to client components for the gallery and variant selector. Cart is re-keyed by `variant_id`.

**Tech Stack:** Next.js 16, TypeScript, PostgreSQL via `pg`, shadcn/ui, Tailwind CSS, Vercel Blob

**Spec:** `docs/superpowers/specs/2026-03-23-product-variants-gallery-design.md`

**IMPORTANT:** Do not modify or delete any files in `plantInventory/` or `plantInventoryServer/`.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/types.ts` | Modify | Add VariantType, ImageType, PlantVariant, PlantImage; update Plant, Category, OrderDetail, CartItem |
| `src/lib/db/seed.ts` | Modify | New schema with plant_variants, plant_images; sample data with multiple variants |
| `src/lib/db/variants.ts` | Create | Query functions for plant_variants |
| `src/lib/db/images.ts` | Create | Query functions for plant_images |
| `src/lib/db/items.ts` | Modify | Update queries to join with variants for price/inventory |
| `src/lib/db/categories.ts` | Modify | Remove price from Category queries |
| `src/lib/db/order-items.ts` | Modify | Add variant_id to createOrderItem |
| `src/lib/cart-context.tsx` | Modify | Re-key by variant_id, update addItem/removeItem/updateQuantity |
| `src/components/image-gallery.tsx` | Create | Client component for multi-image gallery with badges |
| `src/components/variant-selector.tsx` | Create | Client component for variant list with add-to-cart |
| `src/app/products/[productId]/page.tsx` | Modify | Fetch variants/images in parallel, use new components |
| `src/app/products/page.tsx` | Modify | Show price range, use first gallery image |
| `src/app/page.tsx` | Modify | Update featured cards for new data shape |
| `src/app/cart/page.tsx` | Modify | Display variant type, key by variant_id |
| `src/app/api/upload/route.ts` | Modify | Insert into plant_images instead of updating plants.image |
| `src/app/api/order-items/route.ts` | Modify | Accept variant_id |
| `src/components/add-to-cart-button.tsx` | Delete | Replaced by variant-selector.tsx |
| `src/components/image-upload.tsx` | Modify | Add image_type and caption fields |

---

### Task 1: Update TypeScript types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Replace types.ts with new types**

```typescript
// src/lib/types.ts

export type VariantType = 'cutting' | 'cut_to_order' | 'mother_stand' | 'op_seeds' | 'hybrid_seeds';
export type ImageType = 'plant' | 'mother' | 'father' | 'cutting' | 'grown_example';

export type Category = {
  id: number;
  name: string;
};

export type Plant = {
  id: number;
  cultivar_name: string;
  category_id: number;
  details: string | null;
  in_stock: boolean;
};

export type PlantVariant = {
  id: number;
  plant_id: number;
  variant_type: VariantType;
  price: number;
  inventory: number;
  label: string | null;
  note: string | null;
  sort_order: number;
};

export type PlantImage = {
  id: number;
  plant_id: number;
  url: string;
  image_type: ImageType;
  caption: string | null;
  sort_order: number;
};

export type PlantWithPricing = Plant & {
  min_price: number;
  variant_count: number;
  primary_image_url: string | null;
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
  variant_id: number | null;
  price_each: number;
  quantity: number;
};

export type CartItem = {
  plant_id: number;
  variant_id: number;
  cultivar_name: string;
  variant_type: string;
  variant_label: string;
  price: number;
  quantity: number;
  max_quantity: number;
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: Type errors in files that use the old Plant/Category shapes. This is expected and will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "update types for product variants and image gallery"
```

---

### Task 2: Rewrite seed script with new schema

**Files:**
- Modify: `src/lib/db/seed.ts`

- [ ] **Step 1: Replace seed.ts with new schema and sample data**

```typescript
// src/lib/db/seed.ts
import pg from "pg";

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://jordanumlauf@localhost:5432/cactus_shop",
});

async function dropTables() {
  console.log("Dropping all tables...");
  await client.query(`
    DROP TABLE IF EXISTS order_details;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS plant_variants;
    DROP TABLE IF EXISTS plant_images;
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
      name VARCHAR(50) NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE plants (
      id SERIAL PRIMARY KEY,
      cultivar_name VARCHAR(100) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      details TEXT,
      in_stock BOOLEAN DEFAULT false
    );
  `);

  await client.query(`
    CREATE TABLE plant_variants (
      id SERIAL PRIMARY KEY,
      plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      variant_type VARCHAR(20) NOT NULL CHECK (variant_type IN ('cutting', 'rooted_cutting', 'cut_to_order', 'mother_stand', 'seedling', 'op_seeds', 'hybrid_seeds')),
      price INTEGER NOT NULL,
      inventory INTEGER DEFAULT 0,
      label VARCHAR(100),
      note TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await client.query(`
    CREATE TABLE plant_images (
      id SERIAL PRIMARY KEY,
      plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      url VARCHAR(500) NOT NULL,
      image_type VARCHAR(20) DEFAULT 'plant' CHECK (image_type IN ('plant', 'mother', 'father', 'cutting', 'grown_example')),
      caption VARCHAR(200),
      sort_order INTEGER DEFAULT 0
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
      variant_id INTEGER REFERENCES plant_variants(id),
      price_each INTEGER,
      quantity INTEGER
    );
  `);

  await client.query(`
    CREATE INDEX idx_plant_variants_plant_id ON plant_variants(plant_id);
    CREATE INDEX idx_plant_images_plant_id ON plant_images(plant_id);
  `);

  console.log("Finished creating tables.");
}

async function seedData() {
  console.log("Seeding sample data...");

  await client.query(`
    INSERT INTO categories (name) VALUES
      ('seeds'),
      ('cuts'),
      ('stands');
  `);

  // Plant 1: Echeveria Lola (cutting + mother stand)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (1, 'Echeveria Lola', 2, 'Rosette-forming succulent with pale purple leaves. Provenance: Originally sourced from Korean nursery.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, note, sort_order) VALUES
      (1, 'cutting', 15, 8, 'The cut you see here is the cut you get, unless noted as an inventory listing.', 0),
      (1, 'mother_stand', 45, 1, NULL, 1);
  `);

  // Note: plant_images are not seeded with sample data because image URLs
  // come from Vercel Blob uploads. The gallery will show the cactus placeholder
  // until images are uploaded via the UI. This is intentional.

  // Plant 2: Prickly Pear (cutting + cut to order)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (2, 'Prickly Pear', 2, 'Paddle-shaped cactus with colorful fruit.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, note, sort_order) VALUES
      (2, 'cutting', 10, 12, 'Inventory listing, so you will likely not receive the exact cut shown here.', 0),
      (2, 'cut_to_order', 15, 5, 'Allow 7-10 days for cut-to-order listings to callous before shipment.', 1);
  `);

  // Plant 3: Golden Barrel (seeds only)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (3, 'Golden Barrel', 1, 'Round cactus with golden spines. Mother: Wild collected Baja California.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, label, sort_order) VALUES
      (3, 'op_seeds', 8, 20, 'Pack of 100', 0);
  `);

  // Plant 4: Aloe Vera (out of stock)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (4, 'Aloe Vera', 2, 'Popular succulent known for its soothing gel.', false);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, sort_order) VALUES
      (4, 'cutting', 20, 0, 0);
  `);

  // Plant 5: Burro's Tail (hybrid seeds)
  await client.query(`
    INSERT INTO plants (id, cultivar_name, category_id, details, in_stock) VALUES
      (5, 'Burro''s Tail', 1, 'Trailing succulent with plump blue-green leaves. Mother: Sedum morganianum x Father: Sedum burrito.', true);
  `);
  await client.query(`
    INSERT INTO plant_variants (plant_id, variant_type, price, inventory, label, sort_order) VALUES
      (5, 'hybrid_seeds', 12, 10, 'Pack of 50', 0);
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

- [ ] **Step 2: Run the seed script**

```bash
npm run seed
```

Expected: All tables created, sample data inserted with variants.

- [ ] **Step 3: Verify data**

```bash
psql cactus_shop -c "SELECT p.cultivar_name, v.variant_type, v.price, v.inventory FROM plants p JOIN plant_variants v ON p.id = v.plant_id ORDER BY p.id, v.sort_order;"
```

Expected: 7 variant rows across 5 plants.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/seed.ts
git commit -m "rewrite seed script with variants and images schema"
```

---

### Task 3: Create variant and image query functions

**Files:**
- Create: `src/lib/db/variants.ts`
- Create: `src/lib/db/images.ts`

- [ ] **Step 1: Create variants.ts**

```typescript
// src/lib/db/variants.ts
import pool from "./client";
import type { PlantVariant } from "../types";

export async function getVariantsByPlantId(plantId: number): Promise<PlantVariant[]> {
  const { rows } = await pool.query(
    "SELECT * FROM plant_variants WHERE plant_id = $1 ORDER BY sort_order",
    [plantId]
  );
  return rows;
}

export async function createVariant(variant: Omit<PlantVariant, "id">): Promise<PlantVariant> {
  const { rows } = await pool.query(
    `INSERT INTO plant_variants (plant_id, variant_type, price, inventory, label, note, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [variant.plant_id, variant.variant_type, variant.price, variant.inventory, variant.label, variant.note, variant.sort_order]
  );
  // Update parent plant in_stock
  await pool.query(
    `UPDATE plants SET in_stock = EXISTS(
      SELECT 1 FROM plant_variants WHERE plant_id = $1 AND inventory > 0
    ) WHERE id = $1`,
    [variant.plant_id]
  );
  return rows[0];
}

export async function updateVariantInventory(id: number, inventory: number): Promise<PlantVariant | null> {
  const { rows } = await pool.query(
    "UPDATE plant_variants SET inventory = $1 WHERE id = $2 RETURNING *",
    [inventory, id]
  );
  if (!rows[0]) return null;
  // Update parent plant in_stock
  await pool.query(
    `UPDATE plants SET in_stock = EXISTS(
      SELECT 1 FROM plant_variants WHERE plant_id = $1 AND inventory > 0
    ) WHERE id = $1`,
    [rows[0].plant_id]
  );
  return rows[0];
}
```

- [ ] **Step 2: Create images.ts**

```typescript
// src/lib/db/images.ts
import pool from "./client";
import type { PlantImage } from "../types";

export async function getImagesByPlantId(plantId: number): Promise<PlantImage[]> {
  const { rows } = await pool.query(
    "SELECT * FROM plant_images WHERE plant_id = $1 ORDER BY sort_order",
    [plantId]
  );
  return rows;
}

export async function createImage(image: Omit<PlantImage, "id">): Promise<PlantImage> {
  const { rows } = await pool.query(
    `INSERT INTO plant_images (plant_id, url, image_type, caption, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [image.plant_id, image.url, image.image_type, image.caption, image.sort_order]
  );
  return rows[0];
}

export async function deleteImage(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM plant_images WHERE id = $1",
    [id]
  );
  return (rowCount ?? 0) > 0;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/variants.ts src/lib/db/images.ts
git commit -m "add query functions for plant variants and images"
```

---

### Task 4: Update existing query functions

**Files:**
- Modify: `src/lib/db/items.ts`
- Modify: `src/lib/db/categories.ts`
- Modify: `src/lib/db/order-items.ts`

- [ ] **Step 1: Update items.ts**

```typescript
// src/lib/db/items.ts
import pool from "./client";
import type { Plant, PlantWithPricing } from "../types";

export async function getItems(): Promise<PlantWithPricing[]> {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      MIN(v.price) as min_price,
      COUNT(v.id)::int as variant_count,
      (SELECT pi.url FROM plant_images pi WHERE pi.plant_id = p.id ORDER BY pi.sort_order LIMIT 1) as primary_image_url
    FROM plants p
    LEFT JOIN plant_variants v ON p.id = v.plant_id
    GROUP BY p.id
    ORDER BY p.id
  `);
  return rows;
}

export async function getFeaturedItems(limit: number = 3): Promise<PlantWithPricing[]> {
  const { rows } = await pool.query(`
    SELECT
      p.*,
      MIN(v.price) as min_price,
      COUNT(v.id)::int as variant_count,
      (SELECT pi.url FROM plant_images pi WHERE pi.plant_id = p.id ORDER BY pi.sort_order LIMIT 1) as primary_image_url
    FROM plants p
    JOIN plant_variants v ON p.id = v.plant_id AND v.inventory > 0
    WHERE p.in_stock = true
    GROUP BY p.id
    LIMIT $1
  `, [limit]);
  return rows;
}

export async function getItemById(id: number): Promise<Plant | null> {
  const { rows } = await pool.query("SELECT * FROM plants WHERE id = $1", [id]);
  return rows[0] || null;
}

const ALLOWED_COLUMNS = new Set(["cultivar_name", "category_id", "details", "in_stock"]);

export async function createItem(item: Omit<Plant, "id">): Promise<Plant> {
  const { rows } = await pool.query(
    `INSERT INTO plants (cultivar_name, category_id, details, in_stock)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [item.cultivar_name, item.category_id, item.details, item.in_stock]
  );
  return rows[0];
}

export async function updateItem(id: number, fields: Partial<Omit<Plant, "id">>): Promise<Plant | null> {
  const entries = Object.entries(fields).filter(
    ([k, v]) => v !== undefined && ALLOWED_COLUMNS.has(k)
  );
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

- [ ] **Step 2: Update categories.ts**

```typescript
// src/lib/db/categories.ts
import pool from "./client";
import type { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const { rows } = await pool.query("SELECT * FROM categories");
  return rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createCategory(name: string): Promise<Category> {
  const { rows } = await pool.query(
    "INSERT INTO categories (name) VALUES ($1) RETURNING *",
    [name]
  );
  return rows[0];
}
```

- [ ] **Step 3: Update order-items.ts**

```typescript
// src/lib/db/order-items.ts
import pool from "./client";
import type { OrderDetail } from "../types";

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
  variantId: number,
  priceEach: number,
  quantity: number
): Promise<OrderDetail> {
  const { rows } = await pool.query(
    `INSERT INTO order_details (order_id, plant_id, variant_id, price_each, quantity)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [orderId, plantId, variantId, priceEach, quantity]
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

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/items.ts src/lib/db/categories.ts src/lib/db/order-items.ts
git commit -m "update query functions for new variant schema"
```

---

### Task 5: Update cart context for variant-keyed items

**Files:**
- Modify: `src/lib/cart-context.tsx`

- [ ] **Step 1: Replace cart-context.tsx**

```typescript
// src/lib/cart-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem } from "./types";

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as CartItem[];
    return parsed.filter(
      (item) => item.variant_id && item.quantity > 0 && item.max_quantity > 0
    );
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === item.variant_id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, item.max_quantity);
        return prev.map((i) =>
          i.variant_id === item.variant_id
            ? { ...i, quantity: newQty, max_quantity: item.max_quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.max_quantity) }];
    });
  }, []);

  const removeItem = useCallback((variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.variant_id === variantId
          ? { ...i, quantity: Math.min(quantity, i.max_quantity) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cart-context.tsx
git commit -m "re-key cart context by variant_id"
```

---

### Task 6: Create image gallery component

**Files:**
- Create: `src/components/image-gallery.tsx`

- [ ] **Step 1: Create image-gallery.tsx**

```tsx
// src/components/image-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import PlantPlaceholder from "@/components/plant-placeholder";
import type { PlantImage, ImageType } from "@/lib/types";

const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  plant: "Plant",
  mother: "Mother",
  father: "Father",
  cutting: "Cutting",
  grown_example: "Grown Seedling",
};

type Props = {
  images: PlantImage[];
  alt: string;
};

export default function ImageGallery({ images, alt }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="max-h-[400px] overflow-hidden rounded-lg">
        <PlantPlaceholder />
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div>
      <div className="relative max-h-[400px] w-full overflow-hidden rounded-lg aspect-[16/9]">
        <Image
          src={active.url}
          alt={active.caption || alt}
          fill
          priority
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
        <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {IMAGE_TYPE_LABELS[active.image_type]}
        </span>
      </div>
      {active.caption && (
        <p className="mt-1 text-sm text-muted-foreground">{active.caption}</p>
      )}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border-2 ${
                i === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              <Image
                src={img.url}
                alt={img.caption || alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/image-gallery.tsx
git commit -m "add image gallery component with type badges"
```

---

### Task 7: Create variant selector component

**Files:**
- Create: `src/components/variant-selector.tsx`

- [ ] **Step 1: Create variant-selector.tsx**

```tsx
// src/components/variant-selector.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { PlantVariant, VariantType } from "@/lib/types";

const VARIANT_TYPE_LABELS: Record<VariantType, string> = {
  cutting: "Cutting",
  rooted_cutting: "Rooted Cutting",
  cut_to_order: "Cut to Order",
  mother_stand: "Mother Stand",
  seedling: "Seedling",
  op_seeds: "OP Seeds",
  hybrid_seeds: "Hybrid Seeds",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

type Props = {
  variants: PlantVariant[];
  plantId: number;
  cultivarName: string;
};

export default function VariantSelector({ variants, plantId, cultivarName }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Available Options</h2>
      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          variant={variant}
          plantId={plantId}
          cultivarName={cultivarName}
        />
      ))}
    </div>
  );
}

function VariantRow({
  variant,
  plantId,
  cultivarName,
}: {
  variant: PlantVariant;
  plantId: number;
  cultivarName: string;
}) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const label = variant.label || VARIANT_TYPE_LABELS[variant.variant_type];
  const cartItem = items.find((i) => i.variant_id === variant.id);
  const currentInCart = cartItem?.quantity ?? 0;
  const maxCanAdd = variant.inventory - currentInCart;
  const outOfStock = variant.inventory <= 0 || maxCanAdd <= 0;

  function handleAdd() {
    addItem({
      plant_id: plantId,
      variant_id: variant.id,
      cultivar_name: cultivarName,
      variant_type: variant.variant_type,
      variant_label: label,
      price: variant.price,
      max_quantity: variant.inventory,
      quantity,
    });
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-lg font-bold">{formatPrice(variant.price)}</p>
          {variant.inventory > 0 ? (
            <p className="text-sm text-green-600">{variant.inventory} available</p>
          ) : (
            <p className="text-sm text-red-500">Out of stock</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {!outOfStock && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => Math.min(maxCanAdd, q + 1))}
                disabled={quantity >= maxCanAdd}
              >
                +
              </Button>
            </div>
          )}
          <Button onClick={handleAdd} disabled={outOfStock || added} className="w-full">
            {added ? "Added!" : outOfStock ? (variant.inventory <= 0 ? "Out of Stock" : "Max in Cart") : "Add to Cart"}
          </Button>
        </div>
      </div>
      {currentInCart > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{currentInCart} already in cart</p>
      )}
      {variant.note && (
        <p className="mt-2 text-sm text-muted-foreground italic">{variant.note}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/variant-selector.tsx
git commit -m "add variant selector component with quantity controls"
```

---

### Task 8: Update product detail page

**Files:**
- Modify: `src/app/products/[productId]/page.tsx`
- Delete: `src/components/add-to-cart-button.tsx` (replaced by variant-selector)

- [ ] **Step 1: Replace product detail page**

```tsx
// src/app/products/[productId]/page.tsx
import { notFound } from "next/navigation";
import { getItemById } from "@/lib/db/items";
import { getCategoryById } from "@/lib/db/categories";
import { getVariantsByPlantId } from "@/lib/db/variants";
import { getImagesByPlantId } from "@/lib/db/images";
import ImageGallery from "@/components/image-gallery";
import VariantSelector from "@/components/variant-selector";
import ImageUpload from "@/components/image-upload";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ productId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));
  if (!plant) return { title: "Product Not Found" };
  return { title: `${plant.cultivar_name} | Rare Cactus and Succulent Inventory` };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const id = Number(productId);
  const [plant, variants, images] = await Promise.all([
    getItemById(id),
    getVariantsByPlantId(id),
    getImagesByPlantId(id),
  ]);

  if (!plant) {
    notFound();
  }

  const category = await getCategoryById(plant.category_id);

  return (
    <div className="mx-auto max-w-3xl">
      <ImageGallery images={images} alt={plant.cultivar_name} />
      <div className="mt-6 space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{plant.cultivar_name}</h1>
          {category && (
            <p className="text-sm text-muted-foreground">
              Category: {category.name}
            </p>
          )}
          {plant.details && (
            <p className="mt-2 text-muted-foreground">{plant.details}</p>
          )}
        </div>
        <VariantSelector
          variants={variants}
          plantId={plant.id}
          cultivarName={plant.cultivar_name}
        />
        <ImageUpload plantId={plant.id} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete add-to-cart-button.tsx**

```bash
rm src/components/add-to-cart-button.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/products/\[productId\]/page.tsx
git rm src/components/add-to-cart-button.tsx
git commit -m "update product detail page with gallery and variant selector"
```

---

### Task 9: Update product list page

**Files:**
- Modify: `src/app/products/page.tsx`

- [ ] **Step 1: Update products page for new data shape**

```tsx
// src/app/products/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItems } from "@/lib/db/items";
import PlantPlaceholder from "@/components/plant-placeholder";

export const dynamic = "force-dynamic";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

export default async function ProductsPage() {
  const plants = await getItems();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <Card key={plant.id} className="relative transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>
                <Link href={`/products/${plant.id}`} className="after:absolute after:inset-0">
                  {plant.cultivar_name}
                </Link>
              </CardTitle>
            </CardHeader>
            {plant.primary_image_url ? (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={plant.primary_image_url}
                  alt={plant.cultivar_name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <PlantPlaceholder />
            )}
            <CardContent>
              <p className="text-muted-foreground mb-2">{plant.details}</p>
              <span className="font-semibold">
                {plant.variant_count > 1 ? "From " : ""}
                {formatPrice(plant.min_price)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/products/page.tsx
git commit -m "update product list for variant pricing and gallery images"
```

---

### Task 10: Update home page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx with updated home page**

```tsx
// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturedItems } from "@/lib/db/items";
import PlantPlaceholder from "@/components/plant-placeholder";

export const revalidate = 60;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

export default async function Home() {
  const featured = await getFeaturedItems(3);

  return (
    <div className="-mx-4 -mt-8">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a3a2a] to-[#2d5a3d] px-4 py-16 sm:py-20">
        <div className="container mx-auto grid items-center gap-8 sm:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Rare Cactus &amp;<br />Succulent Inventory
            </h1>
            <p className="mt-3 text-white/70">
              Hand-picked rare plants shipped to your door
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/products" />}
              className="mt-6 bg-white text-[#1a3a2a] hover:bg-white/90"
            >
              Shop Now
            </Button>
          </div>
          <div className="flex justify-center">
            <svg
              width="160"
              height="160"
              viewBox="0 0 80 80"
              fill="none"
              aria-hidden="true"
              className="text-white/20"
            >
              <ellipse cx="40" cy="70" rx="20" ry="4" fill="currentColor" />
              <rect x="37" y="30" width="6" height="40" rx="3" fill="currentColor" />
              <ellipse cx="40" cy="24" rx="14" ry="18" fill="currentColor" />
              <ellipse cx="22" cy="40" rx="8" ry="12" fill="currentColor" transform="rotate(-20 22 40)" />
              <ellipse cx="58" cy="40" rx="8" ry="12" fill="currentColor" transform="rotate(20 58 40)" />
            </svg>
          </div>
        </div>
      </section>

      {/* Featured Plants */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Featured Plants</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((plant) => (
              <Card key={plant.id} className="relative transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle>
                    <Link href={`/products/${plant.id}`} className="after:absolute after:inset-0">
                      {plant.cultivar_name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                {plant.primary_image_url ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={plant.primary_image_url}
                      alt={plant.cultivar_name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <PlantPlaceholder />
                )}
                <CardContent>
                  <p className="text-muted-foreground mb-2">{plant.details}</p>
                  <span className="font-semibold">
                    {plant.variant_count > 1 ? "From " : ""}
                    {formatPrice(plant.min_price)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              nativeButton={false}
              render={<Link href="/products" />}
              variant="outline"
            >
              View All Products
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

```bash
npm run dev
```

Visit http://localhost:3000. Featured cards should show placeholder images and "From $X" pricing.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "update home page featured cards for variant pricing"
```

---

### Task 11: Update cart page

**Files:**
- Modify: `src/app/cart/page.tsx`

- [ ] **Step 1: Replace cart page with variant-aware version**

```tsx
// src/app/cart/page.tsx
"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">Add some plants to get started!</p>
        <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Cart</h1>
        <Button variant="ghost" size="sm" onClick={() => clearCart()}>
          Clear Cart
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.variant_id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-semibold">{item.cultivar_name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.variant_label} - {formatPrice(item.price)} each
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                  disabled={item.quantity >= item.max_quantity}
                >
                  +
                </Button>
                <span className="w-16 text-right font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.variant_id)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <span className="text-lg font-bold">Total: {formatPrice(totalPrice)}</span>
        <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/cart/page.tsx
git commit -m "update cart page to show variant type per item"
```

---

### Task 12: Update upload API and image upload component

**Files:**
- Modify: `src/app/api/upload/route.ts`
- Modify: `src/components/image-upload.tsx`

- [ ] **Step 1: Update upload route to insert into plant_images**

```typescript
// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createImage } from "@/lib/db/images";
import type { ImageType } from "@/lib/types";

const VALID_IMAGE_TYPES: ImageType[] = ["plant", "mother", "father", "cutting", "grown_example"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const plantId = formData.get("plant_id") as string | null;
    const imageType = (formData.get("image_type") as string) || "plant";
    const caption = (formData.get("caption") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!plantId) {
      return NextResponse.json({ error: "plant_id is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const id = Number(plantId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid plant_id" }, { status: 400 });
    }

    if (!VALID_IMAGE_TYPES.includes(imageType as ImageType)) {
      return NextResponse.json({ error: "Invalid image_type" }, { status: 400 });
    }

    const blob = await put(`plants/${id}/${file.name}`, file, {
      access: "public",
    });

    const image = await createImage({
      plant_id: id,
      url: blob.url,
      image_type: imageType as ImageType,
      caption,
      sort_order: 0,
    });

    return NextResponse.json(image);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace image-upload.tsx with updated version**

```tsx
// src/components/image-upload.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ImageType } from "@/lib/types";

const IMAGE_TYPE_OPTIONS: { value: ImageType; label: string }[] = [
  { value: "plant", label: "Plant" },
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "cutting", label: "Cutting" },
  { value: "grown_example", label: "Grown Example" },
];

type Props = {
  plantId: number;
};

export default function ImageUpload({ plantId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageType, setImageType] = useState<ImageType>("plant");
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("plant_id", String(plantId));
      formData.append("image_type", imageType);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      setCaption("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select
          value={imageType}
          onChange={(e) => setImageType(e.target.value as ImageType)}
          className="rounded border bg-background px-2 py-1 text-sm"
        >
          {IMAGE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="rounded border bg-background px-2 py-1 text-sm"
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id={`upload-${plantId}`}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/upload/route.ts src/components/image-upload.tsx
git commit -m "update upload API and component for image gallery"
```

---

### Task 13: Update order-items API route

**Files:**
- Modify: `src/app/api/order-items/route.ts`

- [ ] **Step 1: Replace order-items route with variant-aware version**

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
    const { order_id, plant_id, variant_id, price_each, quantity } = body;

    if (!order_id || !plant_id || !variant_id || !price_each || !quantity) {
      return NextResponse.json(
        { error: "order_id, plant_id, variant_id, price_each, and quantity are required" },
        { status: 400 }
      );
    }

    const item = await createOrderItem(order_id, plant_id, variant_id, price_each, quantity);
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

- [ ] **Step 2: Commit**

```bash
git add src/app/api/order-items/route.ts
git commit -m "add variant_id to order items API"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run the seed script**

```bash
npm run seed
```

- [ ] **Step 2: Build the project**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Start dev server and test**

```bash
npm run dev
```

Test:
- http://localhost:3000 - Home page shows featured plants with "From $X" pricing
- http://localhost:3000/products - Product list with price ranges and placeholder images
- http://localhost:3000/products/1 - Echeveria Lola with 2 variants (cutting + mother stand), variant selector, gallery placeholder
- http://localhost:3000/products/3 - Golden Barrel with 1 variant (OP Seeds, Pack of 100)
- http://localhost:3000/products/4 - Aloe Vera with out-of-stock variant
- http://localhost:3000/cart - Cart shows variant type labels ("Echeveria Lola - Cutting")

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

- [ ] **Step 5: Commit any cleanup**

```bash
git add src/ package.json
git commit -m "final cleanup for product variants feature"
```
