# Shipping Phase 1: Config + Rate Calculation - Design Spec

## Overview

Add shipping rate configuration and calculation to the plant app. Admin can configure flat rates per variant type or use real-time USPS rates via Shippo. Customers see shipping costs in the cart before checkout. This is Phase 1 of a two-phase shipping feature. Phase 2 (label generation, tracking, auto-generation after payment) comes after Stripe integration.

## Scope

**In scope:**
- New `shipping_config` database table with per-variant-type shipping settings
- New `special` variant type added across the app
- `weight_lbs`, `weight_oz`, and `shipping_override` columns on `plant_variants`
- "Shipping" tab in admin portal to manage shipping config
- Weight and shipping override fields in the product form
- Shipping rate calculation API endpoint
- Cart page shipping estimate with ZIP code input
- Shippo integration for real-time USPS rates, abstracted behind a provider interface

**Out of scope (Phase 2):**
- Label generation
- Tracking numbers and webhooks
- Auto-label after payment (requires Stripe)
- Package dimensions (weight-only for Phase 1)

## Database Changes

### New Table: `shipping_config`

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PRIMARY KEY | |
| variant_type | VARCHAR(20) UNIQUE NOT NULL | One of the 8 variant types |
| method | VARCHAR(10) NOT NULL | "flat" or "realtime" |
| base_price | INTEGER | Cents. First item shipping cost. Null for realtime. |
| additional_price | INTEGER | Cents. Each additional item cost. Null for realtime. |

**Seed data:**

| variant_type | method | base_price | additional_price |
|---|---|---|---|
| cutting | flat | 600 | 150 |
| rooted_cutting | realtime | null | null |
| cut_to_order | realtime | null | null |
| mother_stand | realtime | null | null |
| seedling | realtime | null | null |
| op_seeds | flat | 400 | 100 |
| hybrid_seeds | flat | 400 | 100 |
| special | realtime | null | null |

### Modified Table: `plant_variants`

Add three columns:

| Column | Type | Default | Notes |
|---|---|---|---|
| weight_lbs | INTEGER | 0 | Package weight pounds component |
| weight_oz | INTEGER | 0 | Package weight ounces component |
| shipping_override | INTEGER | null | Optional per-variant flat shipping rate in cents. Overrides shipping_config for this variant. Used for mother stands and specials with cultivar-specific shipping. |

### Modified Type: `VariantType`

Add `special` to the union:

```
'cutting' | 'rooted_cutting' | 'cut_to_order' | 'mother_stand' | 'seedling' | 'op_seeds' | 'hybrid_seeds' | 'special'
```

Also update the CHECK constraint on the `plant_variants` table in the database.

## Shipping Rate Calculation Logic

### Priority Order

For each cart item, determine shipping cost in this order:

1. **Variant shipping_override** - if the specific variant has a shipping_override value, use it as a flat rate
2. **Shipping config** - look up the variant's type in shipping_config
   - If method is "flat": use base_price for the first item of this type, additional_price for subsequent items of this type
   - If method is "realtime": call Shippo for a USPS rate using the variant's weight

### Flat Rate Grouping

Flat rate items are grouped by variant type. Within each type group:
- First item: base_price
- Each additional item: additional_price

Example: 3 cuttings = 600 + 150 + 150 = 900 cents ($9.00)

Items with shipping_override are not grouped. Each pays its override amount.

### Real-time Rate Calculation

For realtime items without a shipping_override:
- Sum total weight across all realtime items: `(weight_lbs * 16 + weight_oz)` per variant, multiplied by quantity
- Call Shippo with: origin ZIP, destination ZIP, total weight in ounces, parcel dimensions (use a default box size)
- Return the cheapest USPS rate (Priority Mail or First Class depending on weight)

### Combined Total

Total shipping = sum of all flat rate amounts + sum of all override amounts + Shippo realtime rate

## Shippo Integration

### Provider Abstraction

All shipping provider calls go through an interface in `src/lib/shipping/`:

```
src/lib/shipping/
  types.ts        - ShippingRate, RateRequest types
  provider.ts     - Provider interface (getRates)
  shippo.ts       - Shippo implementation
```

The provider interface:

```typescript
type RateRequest = {
  origin_zip: string;
  destination_zip: string;
  weight_oz: number;
};

type ShippingRate = {
  carrier: string;
  service: string;
  rate: number;       // cents
  estimated_days: number;
};

interface ShippingProvider {
  getRates(request: RateRequest): Promise<ShippingRate[]>;
}
```

To switch providers later, create a new implementation of ShippingProvider and swap the import.

### Shippo Setup

- Install `shippo` npm package
- API key stored as `SHIPPO_API_KEY` env var (server-side only)
- Origin ZIP stored as `ORIGIN_ZIP` env var

## Admin Portal

### Shipping Tab (`/admin/shipping`)

Added as a fourth tab in the admin tab navigation: Products | Orders | Customers | Shipping

**Shipping Rates Table:**
- Lists all 8 variant types
- Each row shows: variant type name, method toggle (Flat/Realtime), base price input, additional price input
- When method is "realtime", price inputs are disabled/grayed out
- Save button per row, or a single "Save All" button
- Prices displayed and entered in dollars (converted to/from cents in the API)

**Origin ZIP:**
- Displayed at the top as informational text: "Ship from: [ORIGIN_ZIP]"
- Note that it's configured in Vercel environment variables

### Product Form Updates

Add to each variant row in the product form:
- Weight (lbs) - number input
- Weight (oz) - number input
- Shipping override ($) - optional number input, blank means "use config default"

## Cart Page

### Shipping Estimate Section

Below the cart items table, add a "Shipping Estimate" section:

- ZIP code input field
- "Calculate" button
- Results show:
  - Breakdown by item type (e.g., "Cuttings (3): $9.00", "Mother stand: $12.50 (USPS Priority)")
  - Total shipping cost
  - Estimated delivery days for realtime items
- If no ZIP entered, show "Enter your ZIP code to estimate shipping"
- Loading state while Shippo API is called

## API Routes

### New: `/api/shipping/rates` (POST)

**Request body:**
```json
{
  "destination_zip": "80202",
  "items": [
    { "variant_id": 1, "quantity": 2 },
    { "variant_id": 5, "quantity": 1 }
  ]
}
```

**Response:**
```json
{
  "breakdown": [
    { "description": "Cuttings (2)", "amount": 750 },
    { "description": "Mother stand - USPS Priority Mail (3-5 days)", "amount": 1250 }
  ],
  "total": 2000
}
```

No auth required (customers need to see rates before signing in).

### New: `/api/shipping/config` (GET, PUT)

- GET: Returns all shipping_config rows. Admin only.
- PUT: Upserts all shipping_config rows. Admin only. Body: array of all 8 config objects. Replaces the full config each time (no partial updates).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| SHIPPO_API_KEY | Yes (Phase 1) | Shippo API key for rate lookups |
| ORIGIN_ZIP | Yes | Ship-from ZIP code |

## Error Handling

- If Shippo API is down or returns an error, show "Real-time rates unavailable, please try again" in the cart
- If a realtime variant has no weight set (0 lbs, 0 oz), use a default weight of 8 oz
- Invalid ZIP codes get a 400 response from the rates API
