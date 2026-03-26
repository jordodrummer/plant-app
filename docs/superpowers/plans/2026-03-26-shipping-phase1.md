# Shipping Phase 1: Config + Rate Calculation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shipping rate configuration (flat/realtime per variant type) with an admin UI, extend variants with weight and shipping override fields, and calculate shipping costs in the cart via Shippo for real-time USPS rates.

**Architecture:** New `shipping_config` table holds per-variant-type settings. Admin "Shipping" tab manages the config. Cart page gets a ZIP input that calls `/api/shipping/rates` which groups items by shipping method, calculates flat rates locally, and calls Shippo for realtime items. Shippo calls are behind a provider interface for easy swapping.

**Tech Stack:** Next.js 16 App Router, Supabase, Shippo Node SDK, Tailwind CSS, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-26-shipping-phase1-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/lib/shipping/types.ts` | Shipping types (RateRequest, ShippingRate, ShippingConfig, ShippingProvider) |
| `src/lib/shipping/provider.ts` | Provider interface and factory |
| `src/lib/shipping/shippo.ts` | Shippo implementation of ShippingProvider |
| `src/lib/shipping/calculator.ts` | Rate calculation logic (grouping, flat rates, combining) |
| `src/lib/db/shipping.ts` | Shipping config DB queries |
| `src/app/api/shipping/rates/route.ts` | Public rate calculation endpoint |
| `src/app/api/shipping/config/route.ts` | Admin shipping config CRUD |
| `src/app/admin/shipping/page.tsx` | Admin shipping config page |
| `src/app/admin/shipping/shipping-config-form.tsx` | Client form for editing shipping config |
| `src/app/cart/shipping-estimate.tsx` | Cart shipping estimate component |

### Modified Files

| File | Changes |
|---|---|
| `src/lib/types.ts` | Add `special` to VariantType, add PlantVariant weight/shipping fields, add ShippingConfig type |
| `src/components/admin-tabs.tsx` | Add "Shipping" tab |
| `src/components/variant-selector.tsx` | Add `special` to VARIANT_TYPE_LABELS |
| `src/app/admin/products/product-form.tsx` | Add `special` to VARIANT_TYPES, add weight and shipping override inputs to variant rows |
| `src/app/cart/page.tsx` | Add ShippingEstimate component below cart items |

---

### Task 1: Add `special` variant type and weight/shipping fields to types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Update VariantType and PlantVariant**

In `src/lib/types.ts`, change the VariantType line:

```ts
export type VariantType = 'cutting' | 'rooted_cutting' | 'cut_to_order' | 'mother_stand' | 'seedling' | 'op_seeds' | 'hybrid_seeds' | 'special';
```

Update the PlantVariant type to add the new fields:

```ts
export type PlantVariant = {
  id: number;
  plant_id: number;
  variant_type: VariantType;
  price: number;
  inventory: number;
  label: string | null;
  note: string | null;
  sort_order: number;
  weight_lbs: number;
  weight_oz: number;
  shipping_override: number | null;
};
```

Add ShippingConfig type at the end of the file:

```ts
export type ShippingConfig = {
  id: number;
  variant_type: VariantType;
  method: 'flat' | 'realtime';
  base_price: number | null;
  additional_price: number | null;
};
```

- [ ] **Step 2: Update variant-selector.tsx**

In `src/components/variant-selector.tsx`, add `special` to the VARIANT_TYPE_LABELS object:

```ts
const VARIANT_TYPE_LABELS: Record<VariantType, string> = {
  cutting: "Cutting",
  rooted_cutting: "Rooted Cutting",
  cut_to_order: "Cut to Order",
  mother_stand: "Mother Stand",
  seedling: "Seedling",
  op_seeds: "OP Seeds",
  hybrid_seeds: "Hybrid Seeds",
  special: "Special",
};
```

- [ ] **Step 3: Update product form VARIANT_TYPES array**

In `src/app/admin/products/product-form.tsx`, update the VARIANT_TYPES array:

```ts
const VARIANT_TYPES: VariantType[] = [
  "cutting", "rooted_cutting", "cut_to_order", "mother_stand",
  "seedling", "op_seeds", "hybrid_seeds", "special",
];
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/components/variant-selector.tsx src/app/admin/products/product-form.tsx
git commit -m "add special variant type and shipping fields to types"
```

---

### Task 2: Database migrations (run in Supabase SQL editor)

**Files:**
- Modify: `src/lib/db/seed.ts` (update for reference, not to run)

This task produces SQL that must be run manually in the Supabase SQL editor. Also update the seed script for reference.

- [ ] **Step 1: Create the migration SQL file**

Create `docs/migrations/2026-03-26-shipping-phase1.sql`:

```sql
-- Add special to variant_type CHECK constraint
ALTER TABLE plant_variants DROP CONSTRAINT IF EXISTS plant_variants_variant_type_check;
ALTER TABLE plant_variants ADD CONSTRAINT plant_variants_variant_type_check
  CHECK (variant_type IN ('cutting', 'rooted_cutting', 'cut_to_order', 'mother_stand', 'seedling', 'op_seeds', 'hybrid_seeds', 'special'));

-- Add weight and shipping override columns to plant_variants
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS weight_lbs INTEGER DEFAULT 0;
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS weight_oz INTEGER DEFAULT 0;
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS shipping_override INTEGER;

-- Create shipping_config table
CREATE TABLE IF NOT EXISTS shipping_config (
  id SERIAL PRIMARY KEY,
  variant_type VARCHAR(20) UNIQUE NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('flat', 'realtime')),
  base_price INTEGER,
  additional_price INTEGER
);

-- Seed default shipping config
INSERT INTO shipping_config (variant_type, method, base_price, additional_price) VALUES
  ('cutting', 'flat', 600, 150),
  ('rooted_cutting', 'realtime', NULL, NULL),
  ('cut_to_order', 'realtime', NULL, NULL),
  ('mother_stand', 'realtime', NULL, NULL),
  ('seedling', 'realtime', NULL, NULL),
  ('op_seeds', 'flat', 400, 100),
  ('hybrid_seeds', 'flat', 400, 100),
  ('special', 'realtime', NULL, NULL)
ON CONFLICT (variant_type) DO NOTHING;
```

- [ ] **Step 2: Update seed.ts for reference**

In `src/lib/db/seed.ts`, update the plant_variants CREATE TABLE statement to include the new columns and the new CHECK constraint. Also add the shipping_config table creation and seeding after the existing tables. This is for reference only (new developers setting up from scratch).

Update the plant_variants CHECK constraint line:

```sql
variant_type VARCHAR(20) NOT NULL CHECK (variant_type IN ('cutting', 'rooted_cutting', 'cut_to_order', 'mother_stand', 'seedling', 'op_seeds', 'hybrid_seeds', 'special')),
```

Add after `sort_order INTEGER DEFAULT 0`:

```sql
weight_lbs INTEGER DEFAULT 0,
weight_oz INTEGER DEFAULT 0,
shipping_override INTEGER
```

Add after the order_details table creation:

```sql
await client.query(`
  CREATE TABLE shipping_config (
    id SERIAL PRIMARY KEY,
    variant_type VARCHAR(20) UNIQUE NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('flat', 'realtime')),
    base_price INTEGER,
    additional_price INTEGER
  );
`);
```

Add to seedData() after customers insert:

```sql
await client.query(`
  INSERT INTO shipping_config (variant_type, method, base_price, additional_price) VALUES
    ('cutting', 'flat', 600, 150),
    ('rooted_cutting', 'realtime', NULL, NULL),
    ('cut_to_order', 'realtime', NULL, NULL),
    ('mother_stand', 'realtime', NULL, NULL),
    ('seedling', 'realtime', NULL, NULL),
    ('op_seeds', 'flat', 400, 100),
    ('hybrid_seeds', 'flat', 400, 100),
    ('special', 'realtime', NULL, NULL);
`);
```

- [ ] **Step 3: Tell user to run the migration SQL**

The migration SQL from step 1 needs to be run in the Supabase SQL editor. Tell the user to run `docs/migrations/2026-03-26-shipping-phase1.sql`.

- [ ] **Step 4: Commit**

```bash
git add docs/migrations/2026-03-26-shipping-phase1.sql src/lib/db/seed.ts
git commit -m "add shipping config table and variant weight columns migration"
```

---

### Task 3: Shipping config DB queries

**Files:**
- Create: `src/lib/db/shipping.ts`

- [ ] **Step 1: Create shipping query functions**

Create `src/lib/db/shipping.ts`:

```ts
import { getSupabase } from "../supabase/server";
import type { ShippingConfig } from "../types";

export async function getShippingConfig(): Promise<ShippingConfig[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("shipping_config")
    .select("*")
    .order("variant_type");

  if (error) throw error;
  return data ?? [];
}

export async function upsertShippingConfig(configs: Omit<ShippingConfig, "id">[]): Promise<void> {
  const supabase = getSupabase();

  for (const config of configs) {
    const { error } = await supabase
      .from("shipping_config")
      .upsert(
        {
          variant_type: config.variant_type,
          method: config.method,
          base_price: config.method === "flat" ? config.base_price : null,
          additional_price: config.method === "flat" ? config.additional_price : null,
        },
        { onConflict: "variant_type" }
      );

    if (error) throw error;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/shipping.ts
git commit -m "add shipping config database query functions"
```

---

### Task 4: Shipping provider interface and Shippo implementation

**Files:**
- Create: `src/lib/shipping/types.ts`
- Create: `src/lib/shipping/provider.ts`
- Create: `src/lib/shipping/shippo.ts`

- [ ] **Step 1: Install Shippo SDK**

```bash
npm install shippo
```

- [ ] **Step 2: Create shipping types**

Create `src/lib/shipping/types.ts`:

```ts
export type RateRequest = {
  origin_zip: string;
  destination_zip: string;
  weight_oz: number;
};

export type ShippingRate = {
  carrier: string;
  service: string;
  rate: number;
  estimated_days: number;
};

export interface ShippingProvider {
  getRates(request: RateRequest): Promise<ShippingRate[]>;
}
```

- [ ] **Step 3: Create provider factory**

Create `src/lib/shipping/provider.ts`:

```ts
import type { ShippingProvider } from "./types";
import { ShippoProvider } from "./shippo";

let provider: ShippingProvider | null = null;

export function getShippingProvider(): ShippingProvider {
  if (!provider) {
    provider = new ShippoProvider();
  }
  return provider;
}
```

- [ ] **Step 4: Create Shippo implementation**

Create `src/lib/shipping/shippo.ts`:

```ts
import { Shippo } from "shippo";
import type { ShippingProvider, RateRequest, ShippingRate } from "./types";

export class ShippoProvider implements ShippingProvider {
  private client: Shippo;

  constructor() {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) throw new Error("SHIPPO_API_KEY is not set");
    this.client = new Shippo({ apiKeyHeader: apiKey });
  }

  async getRates(request: RateRequest): Promise<ShippingRate[]> {
    const shipment = await this.client.shipments.create({
      addressFrom: {
        zip: request.origin_zip,
        country: "US",
      },
      addressTo: {
        zip: request.destination_zip,
        country: "US",
      },
      parcels: [
        {
          length: "10",
          width: "8",
          height: "4",
          distanceUnit: "in",
          weight: String(request.weight_oz),
          massUnit: "oz",
        },
      ],
      async: false,
    });

    return (shipment.rates ?? [])
      .filter((r) => r.provider === "USPS")
      .map((r) => ({
        carrier: r.provider,
        service: r.servicelevel?.name ?? "Standard",
        rate: Math.round(parseFloat(r.amount) * 100),
        estimated_days: r.estimatedDays ?? 5,
      }))
      .sort((a, b) => a.rate - b.rate);
  }
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/shipping package.json package-lock.json
git commit -m "add shipping provider interface with Shippo implementation"
```

---

### Task 5: Shipping rate calculator

**Files:**
- Create: `src/lib/shipping/calculator.ts`

- [ ] **Step 1: Create the rate calculator**

Create `src/lib/shipping/calculator.ts`:

```ts
import type { ShippingConfig } from "../types";
import type { ShippingRate } from "./types";
import { getShippingProvider } from "./provider";

type CartVariant = {
  variant_id: number;
  variant_type: string;
  quantity: number;
  weight_lbs: number;
  weight_oz: number;
  shipping_override: number | null;
};

type ShippingBreakdown = {
  description: string;
  amount: number;
};

type ShippingResult = {
  breakdown: ShippingBreakdown[];
  total: number;
};

const DEFAULT_WEIGHT_OZ = 8;

export async function calculateShipping(
  items: CartVariant[],
  configs: ShippingConfig[],
  destinationZip: string
): Promise<ShippingResult> {
  const configMap = new Map(configs.map((c) => [c.variant_type, c]));
  const breakdown: ShippingBreakdown[] = [];

  // Items with shipping_override pay their override amount
  const overrideItems = items.filter((i) => i.shipping_override != null);
  for (const item of overrideItems) {
    const amount = item.shipping_override! * item.quantity;
    breakdown.push({
      description: `Shipping override (${item.variant_type.replace(/_/g, " ")}, qty ${item.quantity})`,
      amount,
    });
  }

  // Remaining items grouped by config method
  const remaining = items.filter((i) => i.shipping_override == null);

  // Flat rate items grouped by variant type
  const flatGroups = new Map<string, { config: ShippingConfig; totalQty: number }>();
  const realtimeItems: CartVariant[] = [];

  for (const item of remaining) {
    const config = configMap.get(item.variant_type);
    if (!config || config.method === "realtime") {
      realtimeItems.push(item);
    } else {
      const existing = flatGroups.get(item.variant_type);
      if (existing) {
        existing.totalQty += item.quantity;
      } else {
        flatGroups.set(item.variant_type, { config, totalQty: item.quantity });
      }
    }
  }

  // Calculate flat rate totals
  for (const [variantType, { config, totalQty }] of flatGroups) {
    const base = config.base_price ?? 0;
    const additional = config.additional_price ?? 0;
    const amount = base + additional * (totalQty - 1);
    breakdown.push({
      description: `${variantType.replace(/_/g, " ")} (${totalQty})`,
      amount,
    });
  }

  // Calculate realtime rates
  if (realtimeItems.length > 0) {
    const totalWeightOz = realtimeItems.reduce((sum, item) => {
      const itemWeight = item.weight_lbs * 16 + item.weight_oz;
      const weight = itemWeight > 0 ? itemWeight : DEFAULT_WEIGHT_OZ;
      return sum + weight * item.quantity;
    }, 0);

    const originZip = process.env.ORIGIN_ZIP;
    if (!originZip) {
      breakdown.push({ description: "Real-time shipping (origin ZIP not configured)", amount: 0 });
    } else {
      try {
        const provider = getShippingProvider();
        const rates = await provider.getRates({
          origin_zip: originZip,
          destination_zip: destinationZip,
          weight_oz: totalWeightOz,
        });

        if (rates.length > 0) {
          const cheapest = rates[0];
          breakdown.push({
            description: `${cheapest.service} (${cheapest.estimated_days} days)`,
            amount: cheapest.rate,
          });
        } else {
          breakdown.push({ description: "No USPS rates available", amount: 0 });
        }
      } catch {
        breakdown.push({ description: "Real-time rates unavailable, please try again", amount: 0 });
      }
    }
  }

  const total = breakdown.reduce((sum, b) => sum + b.amount, 0);
  return { breakdown, total };
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/shipping/calculator.ts
git commit -m "add shipping rate calculator with flat and realtime support"
```

---

### Task 6: Shipping rates API endpoint

**Files:**
- Create: `src/app/api/shipping/rates/route.ts`

- [ ] **Step 1: Create the rates endpoint**

Create `src/app/api/shipping/rates/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getShippingConfig } from "@/lib/db/shipping";
import { calculateShipping } from "@/lib/shipping/calculator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_zip, items } = body;

    if (!destination_zip || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "destination_zip and items are required" },
        { status: 400 }
      );
    }

    if (!/^\d{5}$/.test(destination_zip)) {
      return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
    }

    // Fetch variant details for all items
    const variantIds = items.map((i: { variant_id: number }) => i.variant_id);
    const supabase = getSupabase();
    const { data: variants, error } = await supabase
      .from("plant_variants")
      .select("id, variant_type, weight_lbs, weight_oz, shipping_override")
      .in("id", variantIds);

    if (error) throw error;

    const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

    const cartVariants = items
      .map((item: { variant_id: number; quantity: number }) => {
        const v = variantMap.get(item.variant_id);
        if (!v) return null;
        return {
          variant_id: v.id,
          variant_type: v.variant_type,
          quantity: item.quantity,
          weight_lbs: v.weight_lbs ?? 0,
          weight_oz: v.weight_oz ?? 0,
          shipping_override: v.shipping_override,
        };
      })
      .filter(Boolean);

    const configs = await getShippingConfig();
    const result = await calculateShipping(cartVariants, configs, destination_zip);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/shipping/rates
git commit -m "add shipping rates API endpoint"
```

---

### Task 7: Shipping config API endpoint

**Files:**
- Create: `src/app/api/shipping/config/route.ts`

- [ ] **Step 1: Create the config endpoint**

Create `src/app/api/shipping/config/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getShippingConfig, upsertShippingConfig } from "@/lib/db/shipping";
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

    const configs = await getShippingConfig();
    return NextResponse.json(configs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array of config objects" }, { status: 400 });
    }

    await upsertShippingConfig(body);
    const updated = await getShippingConfig();
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/shipping/config
git commit -m "add admin shipping config API endpoint"
```

---

### Task 8: Admin shipping tab and config page

**Files:**
- Modify: `src/components/admin-tabs.tsx`
- Create: `src/app/admin/shipping/page.tsx`
- Create: `src/app/admin/shipping/shipping-config-form.tsx`

- [ ] **Step 1: Add Shipping tab**

In `src/components/admin-tabs.tsx`, add the shipping tab to the tabs array:

```ts
const tabs = [
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Shipping", href: "/admin/shipping" },
];
```

- [ ] **Step 2: Create shipping config form**

Create `src/app/admin/shipping/shipping-config-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ShippingConfig, VariantType } from "@/lib/types";

const VARIANT_TYPE_LABELS: Record<VariantType, string> = {
  cutting: "Cutting",
  rooted_cutting: "Rooted Cutting",
  cut_to_order: "Cut to Order",
  mother_stand: "Mother Stand",
  seedling: "Seedling",
  op_seeds: "OP Seeds",
  hybrid_seeds: "Hybrid Seeds",
  special: "Special",
};

function centsToStr(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function strToCents(str: string): number | null {
  const val = parseFloat(str);
  if (isNaN(val)) return null;
  return Math.round(val * 100);
}

export default function ShippingConfigForm({ configs }: { configs: ShippingConfig[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    configs.map((c) => ({
      variant_type: c.variant_type,
      method: c.method,
      base_price: centsToStr(c.base_price),
      additional_price: centsToStr(c.additional_price),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateRow(index: number, field: string, value: string) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "method" && value === "realtime") {
      updated[index].base_price = "";
      updated[index].additional_price = "";
    }
    setRows(updated);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const body = rows.map((r) => ({
      variant_type: r.variant_type,
      method: r.method,
      base_price: r.method === "flat" ? strToCents(r.base_price) : null,
      additional_price: r.method === "flat" ? strToCents(r.additional_price) : null,
    }));

    const res = await fetch("/api/shipping/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError("Failed to save shipping config");
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Saved!</p>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Variant Type</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-left font-medium">Base Price ($)</th>
              <th className="px-4 py-3 text-left font-medium">Additional Item ($)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.variant_type} className="border-b">
                <td className="px-4 py-3 font-medium">
                  {VARIANT_TYPE_LABELS[row.variant_type as VariantType] ?? row.variant_type}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.method}
                    onChange={(e) => updateRow(i, "method", e.target.value)}
                    className="rounded border bg-background px-2 py-1 text-sm"
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="realtime">Real-time</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.base_price}
                    onChange={(e) => updateRow(i, "base_price", e.target.value)}
                    disabled={row.method === "realtime"}
                    className="w-24 rounded border bg-background px-2 py-1 text-sm disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.additional_price}
                    onChange={(e) => updateRow(i, "additional_price", e.target.value)}
                    disabled={row.method === "realtime"}
                    className="w-24 rounded border bg-background px-2 py-1 text-sm disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save All"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create shipping admin page**

Create `src/app/admin/shipping/page.tsx`:

```tsx
import { getShippingConfig } from "@/lib/db/shipping";
import ShippingConfigForm from "./shipping-config-form";

export default async function AdminShippingPage() {
  const configs = await getShippingConfig();

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold">Shipping Configuration</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ship from: {process.env.ORIGIN_ZIP ?? "Not configured (set ORIGIN_ZIP env var)"}
      </p>
      <ShippingConfigForm configs={configs} />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin-tabs.tsx src/app/admin/shipping
git commit -m "add admin shipping config page with Shipping tab"
```

---

### Task 9: Add weight and shipping override to product form

**Files:**
- Modify: `src/app/admin/products/product-form.tsx`

- [ ] **Step 1: Update VariantRow type and state initialization**

In `src/app/admin/products/product-form.tsx`, update the VariantRow type:

```ts
type VariantRow = {
  id?: number;
  variant_type: VariantType;
  price: string;
  inventory: string;
  label: string;
  note: string;
  sort_order: number;
  weight_lbs: string;
  weight_oz: string;
  shipping_override: string;
};
```

Update the variant state initialization (in the `useState<VariantRow[]>` call) to include the new fields:

```ts
const [variantRows, setVariantRows] = useState<VariantRow[]>(
  variants?.map((v) => ({
    id: v.id,
    variant_type: v.variant_type,
    price: v.price.toString(),
    inventory: v.inventory.toString(),
    label: v.label ?? "",
    note: v.note ?? "",
    sort_order: v.sort_order,
    weight_lbs: (v.weight_lbs ?? 0).toString(),
    weight_oz: (v.weight_oz ?? 0).toString(),
    shipping_override: v.shipping_override != null ? (v.shipping_override / 100).toFixed(2) : "",
  })) ?? []
);
```

Update the `addVariantRow` function to include the new fields in the new row:

```ts
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
      weight_lbs: "0",
      weight_oz: "0",
      shipping_override: "",
    },
  ]);
}
```

- [ ] **Step 2: Update variant body in handleSubmit**

In the `handleSubmit` function, update the `variantBody` object to include the new fields:

```ts
const variantBody = {
  plant_id: plantId,
  variant_type: row.variant_type,
  price: parseFloat(row.price),
  inventory: parseInt(row.inventory, 10),
  label: row.label || null,
  note: row.note || null,
  sort_order: row.sort_order,
  weight_lbs: parseInt(row.weight_lbs, 10) || 0,
  weight_oz: parseInt(row.weight_oz, 10) || 0,
  shipping_override: row.shipping_override ? Math.round(parseFloat(row.shipping_override) * 100) : null,
};
```

- [ ] **Step 3: Add weight and shipping override inputs to variant row UI**

In the variant row JSX (inside the `variantRows.map` block), add three new input fields after the Label input:

```tsx
<div>
  <label className="mb-1 block text-xs text-muted-foreground">Weight (lbs)</label>
  <input
    type="number"
    min="0"
    value={row.weight_lbs}
    onChange={(e) => updateVariantRow(i, "weight_lbs", e.target.value)}
    className="w-16 rounded border bg-background px-2 py-1.5 text-sm"
  />
</div>
<div>
  <label className="mb-1 block text-xs text-muted-foreground">Weight (oz)</label>
  <input
    type="number"
    min="0"
    value={row.weight_oz}
    onChange={(e) => updateVariantRow(i, "weight_oz", e.target.value)}
    className="w-16 rounded border bg-background px-2 py-1.5 text-sm"
  />
</div>
<div>
  <label className="mb-1 block text-xs text-muted-foreground">Ship override ($)</label>
  <input
    type="number"
    step="0.01"
    min="0"
    value={row.shipping_override}
    onChange={(e) => updateVariantRow(i, "shipping_override", e.target.value)}
    placeholder="Auto"
    className="w-24 rounded border bg-background px-2 py-1.5 text-sm"
  />
</div>
```

- [ ] **Step 4: Update variant allowlist in variants.ts**

In `src/lib/db/variants.ts`, update the `VARIANT_ALLOWED_COLUMNS` set to include the new fields:

```ts
const VARIANT_ALLOWED_COLUMNS = new Set(["variant_type", "price", "inventory", "label", "note", "sort_order", "weight_lbs", "weight_oz", "shipping_override"]);
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/products/product-form.tsx src/lib/db/variants.ts
git commit -m "add weight and shipping override fields to product form"
```

---

### Task 10: Cart shipping estimate component

**Files:**
- Create: `src/app/cart/shipping-estimate.tsx`
- Modify: `src/app/cart/page.tsx`

- [ ] **Step 1: Create shipping estimate component**

Create `src/app/cart/shipping-estimate.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Breakdown = {
  description: string;
  amount: number;
};

export default function ShippingEstimate() {
  const { items } = useCart();
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a valid 5-digit ZIP code");
      return;
    }

    setLoading(true);
    setError(null);
    setBreakdown(null);
    setTotal(null);

    const res = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination_zip: zip,
        items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setBreakdown(data.breakdown);
      setTotal(data.total);
    } else {
      setError("Could not calculate shipping. Please try again.");
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">Shipping Estimate</h2>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          className="w-28 rounded border bg-background px-3 py-2 text-sm"
        />
        <Button size="sm" onClick={handleCalculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {breakdown && total != null && (
        <div className="mt-3 space-y-1">
          {breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.description}</span>
              <span>{item.amount > 0 ? formatPrice(item.amount) : "N/A"}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1 text-sm font-semibold">
            <span>Shipping Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add ShippingEstimate to cart page**

In `src/app/cart/page.tsx`, add the import at the top:

```tsx
import ShippingEstimate from "./shipping-estimate";
```

Add the `<ShippingEstimate />` component between the cart items and the total. Insert it right before the existing total div (the `<div className="mt-6 flex items-center justify-between border-t pt-4">` line):

```tsx
      <div className="mt-6">
        <ShippingEstimate />
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4">
```

Note: Change the existing `mt-6` on the total div to `mt-4` since ShippingEstimate now provides spacing.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/cart/shipping-estimate.tsx src/app/cart/page.tsx
git commit -m "add shipping estimate to cart page with ZIP code input"
```

---

### Task 11: Final build verification

**Files:**
- None new (verification only)

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Fix any type errors or build failures.

- [ ] **Step 2: Remind user to run migration and set env vars**

The user needs to:
1. Run `docs/migrations/2026-03-26-shipping-phase1.sql` in the Supabase SQL editor
2. Add `SHIPPO_API_KEY` to `.env.local` and Vercel env vars
3. Add `ORIGIN_ZIP` to `.env.local` and Vercel env vars

- [ ] **Step 3: Manual smoke test**

1. Navigate to /admin/shipping, verify the config table loads with 8 variant types
2. Change a method from realtime to flat, set prices, save
3. Edit a product, verify weight and shipping override fields appear on variant rows
4. Add items to cart, enter a ZIP code, click Calculate
5. Verify flat rate items show correct prices
6. Verify realtime items show USPS rates (requires Shippo API key)

- [ ] **Step 4: Commit any final fixes and push**

```bash
git push origin <branch-name>
```
