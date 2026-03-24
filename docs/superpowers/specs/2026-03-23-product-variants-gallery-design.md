# Product Variants and Image Gallery Design

## Overview

Redesign the data model and product pages to support multiple purchasable variants per cultivar (cuttings, cut-to-order, mother stands, seed packs) and a multi-image gallery with labeled photos (mother, father, cutting, grown examples).

## Sub-projects

This spec covers Sub-project 1 (schema) and Sub-project 2 (product detail page). Sub-project 3 (product list + cart updates) is included as well since it depends on the same schema.

## Database Schema

### `plants` table (updated)

Represents one cultivar, hybrid, or seed lot. Provenance info lives in the `details` text field as free-form text.

```sql
CREATE TABLE plants (
  id SERIAL PRIMARY KEY,
  cultivar_name VARCHAR(100) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  details TEXT,
  in_stock BOOLEAN DEFAULT false
);
```

Removed from current schema: `image`, `price`, `inventory` (these move to `plant_variants` and `plant_images`).

The `in_stock` field is derived. When a variant's stock changes, update the plant's `in_stock` to `true` if any variant has inventory > 0.

### `plant_variants` table (new)

One row per purchasable option on a product page.

```sql
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
```

`in_stock` is removed from variants. Instead, derive it from `inventory > 0` at query time. This eliminates sync issues between `inventory` and `in_stock`.

**`variant_type` values:** `cutting`, `cut_to_order`, `mother_stand`, `op_seeds`, `hybrid_seeds` (enforced by CHECK constraint)

**`label`:** Optional display override. Defaults are derived from `variant_type` if not set (e.g. "Cutting", "Mother Stand", "OP Seeds"). Use for custom labels like "Pack of 100" or "6-inch tip".

**`note`:** Optional text displayed below the add-to-cart button for this variant. Used for messaging like "Allow 7-10 days for cut-to-order listings to callous before shipment."

**`sort_order`:** Controls display order on the product page. Lower numbers appear first.

### `plant_images` table (new)

Multiple images per plant with type labels.

```sql
CREATE TABLE plant_images (
  id SERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  image_type VARCHAR(20) DEFAULT 'plant' CHECK (image_type IN ('plant', 'mother', 'father', 'cutting', 'grown_example')),
  caption VARCHAR(200),
  sort_order INTEGER DEFAULT 0
);
```

**`image_type` values:** `plant`, `mother`, `father`, `cutting`, `grown_example`

**`caption`:** Optional text displayed below the image (e.g. "Mother stand, 3 years old").

**`sort_order`:** Controls gallery order. First image (lowest sort_order) is the primary display image on product cards.

### `order_details` table (updated)

Add `variant_id` to track which variant was purchased.

```sql
ALTER TABLE order_details ADD COLUMN variant_id INTEGER REFERENCES plant_variants(id);
```

The `OrderDetail` type and `createOrderItem()` function are updated to accept and store `variant_id`. The existing `plant_id` column is kept for reference.

### `categories` table (updated)

Drop the `price` column since pricing now lives on `plant_variants`.

```sql
ALTER TABLE categories DROP COLUMN price;
```

The `Category` type is updated to remove `price`.

### Indexes

```sql
CREATE INDEX idx_plant_variants_plant_id ON plant_variants(plant_id);
CREATE INDEX idx_plant_images_plant_id ON plant_images(plant_id);
```

### Migration strategy

1. Create `plant_variants` and `plant_images` tables with indexes
2. Migrate existing `plants` data: for each plant, create one `cutting` variant with the current `price` and `inventory`
3. Migrate existing `image` values to `plant_images` with type `plant`
4. Alter `cultivar_name` column to `VARCHAR(100)`
5. Drop `image`, `price`, `inventory` columns from `plants`
6. Add `variant_id` column to `order_details`
7. Drop `price` column from `categories`
8. Update seed script with new sample data showing multiple variants and images

Since this is an early-stage app with sample data only, the seed script will drop and recreate all tables with the new schema rather than running incremental migrations.

### Sample seed data

```
Plant: "Echeveria Lola"
  Variants:
    - cutting, $15, inventory: 8, note: "The cut you see here is the cut you get."
    - mother_stand, $45, inventory: 1, note: null
  Images:
    - type: plant, caption: "Echeveria Lola cluster"
    - type: cutting, caption: "Fresh 4-inch tip cutting"

Plant: "Prickly Pear"
  Variants:
    - cutting, $10, inventory: 12, note: "Inventory listing, so you will likely not receive the exact cut shown here."
    - cut_to_order, $15, inventory: 5, note: "Allow 7-10 days for cut-to-order listings to callous before shipment."
  Images:
    - type: plant, caption: null

Plant: "Golden Barrel"
  Variants:
    - op_seeds, $8, inventory: 20, label: "Pack of 100", note: null
  Images:
    - type: mother, caption: "Seed mother"
    - type: grown_example, caption: "6-month seedling"
```

## TypeScript Types

```typescript
export type VariantType = 'cutting' | 'rooted_cutting' | 'cut_to_order' | 'mother_stand' | 'seedling' | 'op_seeds' | 'hybrid_seeds';
export type ImageType = 'plant' | 'mother' | 'father' | 'cutting' | 'grown_example';

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

export type Category = {
  id: number;
  name: string;
};

export type OrderDetail = {
  id: number;
  order_id: number;
  plant_id: number;
  variant_id: number;
  price_each: number;
  quantity: number;
};
```

Prices are stored as whole dollars (not cents). Display using `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`.
```

## Query Functions

### New files

**`src/lib/db/variants.ts`:**
- `getVariantsByPlantId(plantId: number): Promise<PlantVariant[]>` - ordered by sort_order
- `createVariant(variant: Omit<PlantVariant, "id">): Promise<PlantVariant>`
- `updateVariantInventory(id: number, inventory: number): Promise<PlantVariant | null>` - also updates `in_stock` and parent plant's `in_stock`

**`src/lib/db/images.ts`:**
- `getImagesByPlantId(plantId: number): Promise<PlantImage[]>` - ordered by sort_order
- `createImage(image: Omit<PlantImage, "id">): Promise<PlantImage>`
- `deleteImage(id: number): Promise<boolean>`

### Updated files

**`src/lib/db/items.ts`:**
- `getItems()` - updated to join with `plant_variants` to get min price and total inventory for the product list
- `getItemById()` - returns the plant row only (variants and images fetched separately)
- `getFeaturedItems()` - updated query to join with variants for price display
- `createItem()` - updated to remove `image`, `price`, `inventory` params (these now go to `plant_variants` and `plant_images`)
- `updateItem()` - updated to remove `image`, `price`, `inventory` from `ALLOWED_COLUMNS`
- `deleteItem()` - unchanged (CASCADE handles variant/image cleanup)

**`src/lib/db/order-items.ts`:**
- `createOrderItem()` - updated to accept and store `variant_id`

## Product Detail Page

### Layout

```
[Image Gallery]
  - Large primary image with type badge (e.g. "Mother", "Cutting")
  - Thumbnail strip below for navigation
  - Client component for interactivity

[Product Info]
  - Cultivar name (h1)
  - Category
  - Details paragraph (contains provenance in free text)

[Variants]
  - List of available variants, each showing:
    - Label (e.g. "Cutting", "Mother Stand", "OP Seeds (Pack of 100)")
    - Price (formatted with Intl.NumberFormat)
    - Inventory count and stock status
    - Quantity selector (+/-) capped at inventory
    - Add to Cart button
    - Note text below button (if set)
    - Disabled state if out of stock
```

### Components

**`src/components/image-gallery.tsx`** (new, client component):
- Receives `PlantImage[]`
- Displays primary image large with a badge for `image_type`
- Thumbnail strip below, click to change primary
- Handles empty state with PlantPlaceholder

**`src/components/variant-selector.tsx`** (new, client component):
- Receives `PlantVariant[]`
- Renders each variant as a row with price, inventory, quantity controls, and add-to-cart
- Displays variant note below button when present
- Uses cart context to check current cart quantity per variant

**`src/app/products/[productId]/page.tsx`** (updated):
- Server component fetches plant, variants, and images in parallel
- Passes data to ImageGallery and VariantSelector client components
- Removes old AddToCartButton usage

## Product List Page

### Changes

- Product cards show the first image from `plant_images` (or PlantPlaceholder)
- Price display changes from single price to a range if multiple variants exist:
  - One variant: "$15"
  - Multiple variants: "From $15"
- No add-to-cart on list page (users must pick a variant on the detail page)

The home page featured plants section uses the same card format and is updated accordingly (price range display, first gallery image).

## Cart Updates

### CartItem type

```typescript
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

Key change: cart items are keyed by `variant_id` instead of `plant_id`. This allows adding both a cutting and a mother stand from the same cultivar.

### Cart context changes

- `addItem` accepts the new CartItem shape with `variant_id`
- `updateQuantity` and `removeItem` keyed by `variant_id`
- Existing localStorage data without `variant_id` is filtered out on load (same pattern as the `max_quantity` migration)

### Cart page changes

- Display format: "Echeveria Lola - Cutting" or "Golden Barrel - OP Seeds (Pack of 100)"
- Uses `variant_label` for the display name alongside `cultivar_name`
- Quantity cap enforced per variant

## Upload API Changes

The existing `/api/upload` route is updated to accept `image_type` and `caption` fields in addition to `file` and `plant_id`. The route switches from calling `updateItem(id, { image: blob.url })` to calling `createImage({ plant_id, url: blob.url, image_type, caption, sort_order })` from the new images query module.

## Performance Considerations

- Product list query joins variants to get min price in a single query (no N+1)
- Product detail fetches plant, variants, and images in parallel using `Promise.all`
- Images use `next/image` with appropriate `sizes` prop
- Featured items query uses `LIMIT` with a join, not full table scan
- `force-dynamic` on product pages (inventory changes in real time). Home page uses `revalidate = 60`.
