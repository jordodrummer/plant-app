# Stripe Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add embedded Stripe Elements checkout with inventory reservation and guest checkout support.

**Architecture:** Checkout page collects address, calls `/api/checkout` to reserve inventory and create a Stripe PaymentIntent, renders Stripe Elements for card input, then a Stripe webhook confirms payment and decrements stock. Reservations expire after 15 minutes via a cleanup cron.

**Tech Stack:** Stripe SDK (`stripe` + `@stripe/stripe-js` + `@stripe/react-stripe-js`), Next.js App Router API routes, Supabase PostgreSQL via service role client.

---

### Task 1: Install Stripe dependencies and create Stripe client

**Files:**
- Modify: `package.json`
- Create: `src/lib/stripe/client.ts`

- [ ] **Step 1: Install Stripe packages**

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

- [ ] **Step 2: Create server-side Stripe client**

Create `src/lib/stripe/client.ts`:

```typescript
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});
```

Note: Check the latest Stripe API version when implementing. Use whatever version the installed SDK defaults to.

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds (the env var check will only throw at runtime if missing).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/lib/stripe/client.ts
git commit -m "add Stripe SDK and server-side client"
```

---

### Task 2: Database migration for reservations and order fields

**Files:**
- Create: `docs/migrations/2026-04-04-stripe-checkout.sql`

- [ ] **Step 1: Write the migration SQL**

Create `docs/migrations/2026-04-04-stripe-checkout.sql`:

```sql
-- Add reserved column to plant_variants for inventory holds
ALTER TABLE plant_variants ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

-- Add checkout fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_street TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_state TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_zip TEXT;
```

- [ ] **Step 2: Run the migration against Supabase**

Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query). Paste the contents of the migration file and execute.

- [ ] **Step 3: Verify columns exist**

In Supabase SQL editor, run:

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'plant_variants' AND column_name = 'reserved';
SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id';
```

Expected: Both queries return one row.

- [ ] **Step 4: Commit**

```bash
git add docs/migrations/2026-04-04-stripe-checkout.sql
git commit -m "add migration for reserved column and order checkout fields"
```

---

### Task 3: Update types and Order DB functions

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/db/orders.ts`

- [ ] **Step 1: Update types**

In `src/lib/types.ts`, replace the `Order` type:

```typescript
export type OrderStatus = 'pending' | 'pending_payment' | 'confirmed' | 'shipped' | 'delivered' | 'deleted' | 'expired';

export type Order = {
  id: number;
  customer_id: number | null;
  created_on: Date;
  updated_on: Date;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  shipping_cost: number | null;
  expires_at: Date | null;
  guest_email: string | null;
  guest_name: string | null;
  shipping_address_street: string | null;
  shipping_address_city: string | null;
  shipping_address_state: string | null;
  shipping_address_zip: string | null;
};
```

- [ ] **Step 2: Add new order DB functions**

In `src/lib/db/orders.ts`, add these new functions and update `createOrder`:

```typescript
import { getServiceSupabase } from "../supabase/server";
import type { Order } from "../types";

export async function getOrders(): Promise<Order[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getOrderById(id: number): Promise<Order | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

type CreateCheckoutOrderParams = {
  customer_id?: number;
  guest_name?: string;
  guest_email?: string;
  stripe_payment_intent_id: string;
  shipping_cost: number;
  expires_at: string;
  shipping_address_street: string;
  shipping_address_city: string;
  shipping_address_state: string;
  shipping_address_zip: string;
};

export async function createCheckoutOrder(params: CreateCheckoutOrderParams): Promise<Order> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_id: params.customer_id ?? null,
      guest_name: params.guest_name ?? null,
      guest_email: params.guest_email ?? null,
      stripe_payment_intent_id: params.stripe_payment_intent_id,
      shipping_cost: params.shipping_cost,
      expires_at: params.expires_at,
      shipping_address_street: params.shipping_address_street,
      shipping_address_city: params.shipping_address_city,
      shipping_address_state: params.shipping_address_state,
      shipping_address_zip: params.shipping_address_zip,
      status: "pending_payment",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createOrder(customerId: number): Promise<Order> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert({ customer_id: customerId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOrderByPaymentIntent(paymentIntentId: string): Promise<Order | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getOrderForConfirmation(id: number): Promise<{
  id: number;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  shipping_cost: number | null;
  shipping_address_street: string | null;
  shipping_address_city: string | null;
  shipping_address_state: string | null;
  shipping_address_zip: string | null;
  created_on: Date;
} | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, guest_name, guest_email, shipping_cost, shipping_address_street, shipping_address_city, shipping_address_state, shipping_address_zip, created_on")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateOrderStatus(id: number, status: string): Promise<Order | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_on: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateOrderShipping(id: number, shippingCost: number, paymentIntentId: string): Promise<Order | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({
      shipping_cost: shippingCost,
      stripe_payment_intent_id: paymentIntentId,
      updated_on: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getExpiredPendingOrders(): Promise<Order[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "pending_payment")
    .lt("expires_at", new Date().toISOString());

  if (error) throw error;
  return data ?? [];
}

export async function deleteOrder(id: number): Promise<boolean> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "deleted", updated_on: new Date().toISOString() })
    .eq("id", id)
    .select();

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds. There may be type warnings in admin pages due to the `status` field change; those are addressed in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/db/orders.ts
git commit -m "update Order type and add checkout order functions"
```

---

### Task 4: Inventory reservation functions

**Files:**
- Create: `src/lib/db/reservations.ts`

- [ ] **Step 1: Create reservation functions**

Create `src/lib/db/reservations.ts`:

```typescript
import { getServiceSupabase } from "../supabase/server";
import { getOrderItems } from "./order-items";
import { getExpiredPendingOrders, updateOrderStatus } from "./orders";

type ReservationItem = {
  variant_id: number;
  quantity: number;
};

/**
 * Atomically reserve inventory for a list of items.
 * Uses PostgreSQL rpc for atomicity: only reserves if quantity - reserved >= requested.
 * Returns true if all items were reserved, false if any failed (and rolls back all).
 */
export async function reserveInventory(items: ReservationItem[]): Promise<boolean> {
  const supabase = getServiceSupabase();
  const reserved: ReservationItem[] = [];

  for (const item of items) {
    const { data: result, error: rpcError } = await supabase.rpc("reserve_variant", {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    });

    if (rpcError || !result) {
      // Rollback previously reserved items
      for (const prev of reserved) {
        await supabase.rpc("release_variant", {
          p_variant_id: prev.variant_id,
          p_quantity: prev.quantity,
        });
      }
      return false;
    }

    reserved.push(item);
  }

  return true;
}

/**
 * Release reserved inventory for an order's items.
 */
export async function releaseReservation(orderId: number): Promise<void> {
  const supabase = getServiceSupabase();
  const items = await getOrderItems(orderId);

  for (const item of items) {
    if (item.variant_id) {
      await supabase.rpc("release_variant", {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      });
    }
  }
}

/**
 * On payment success: decrement both inventory and reserved for the order's items.
 */
export async function confirmReservation(orderId: number): Promise<void> {
  const supabase = getServiceSupabase();
  const items = await getOrderItems(orderId);

  for (const item of items) {
    if (item.variant_id) {
      await supabase.rpc("confirm_variant_sale", {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      });
    }
  }
}

/**
 * Find and release all expired pending_payment orders.
 */
export async function cleanupExpiredReservations(): Promise<number> {
  const expired = await getExpiredPendingOrders();
  let cleaned = 0;

  for (const order of expired) {
    await releaseReservation(order.id);
    await updateOrderStatus(order.id, "expired");
    cleaned++;
  }

  return cleaned;
}
```

- [ ] **Step 2: Create the PostgreSQL RPC functions**

Add to `docs/migrations/2026-04-04-stripe-checkout.sql` (append these after the ALTER TABLE statements):

```sql
-- Reserve inventory: atomically increment reserved if stock available
CREATE OR REPLACE FUNCTION reserve_variant(p_variant_id INTEGER, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE plant_variants
  SET reserved = reserved + p_quantity
  WHERE id = p_variant_id
    AND inventory - reserved >= p_quantity;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Release reservation: decrement reserved
CREATE OR REPLACE FUNCTION release_variant(p_variant_id INTEGER, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE plant_variants
  SET reserved = GREATEST(reserved - p_quantity, 0)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- Confirm sale: decrement both inventory and reserved
CREATE OR REPLACE FUNCTION confirm_variant_sale(p_variant_id INTEGER, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE plant_variants
  SET inventory = inventory - p_quantity,
      reserved = GREATEST(reserved - p_quantity, 0)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;
```

Run these three function definitions in the Supabase SQL editor.

- [ ] **Step 3: Test RPC functions in Supabase SQL editor**

```sql
-- Check a variant's current state
SELECT id, inventory, reserved FROM plant_variants LIMIT 1;
-- Note the id, inventory, reserved values

-- Test reserve (use the id from above)
SELECT reserve_variant(<id>, 1);
-- Expected: true

-- Verify reserved incremented
SELECT id, inventory, reserved FROM plant_variants WHERE id = <id>;

-- Test release
SELECT release_variant(<id>, 1);

-- Verify reserved decremented back
SELECT id, inventory, reserved FROM plant_variants WHERE id = <id>;
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/reservations.ts docs/migrations/2026-04-04-stripe-checkout.sql
git commit -m "add inventory reservation functions and PostgreSQL RPCs"
```

---

### Task 5: Checkout API route

**Files:**
- Create: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Create the checkout API route**

Create `src/app/api/checkout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getShippingConfig } from "@/lib/db/shipping";
import { calculateShipping } from "@/lib/shipping/calculator";
import { createCheckoutOrder } from "@/lib/db/orders";
import { createOrderItem } from "@/lib/db/order-items";
import { reserveInventory } from "@/lib/db/reservations";

type CheckoutItem = {
  plant_id: number;
  variant_id: number;
  quantity: number;
};

type CheckoutBody = {
  items: CheckoutItem[];
  guest_name: string;
  guest_email: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
};

export async function POST(request: Request) {
  try {
    const body: CheckoutBody = await request.json();
    const { items, guest_name, guest_email, shipping_address } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!guest_name || !guest_email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    if (!shipping_address?.street || !shipping_address?.city || !shipping_address?.state || !shipping_address?.zip) {
      return NextResponse.json({ error: "Complete shipping address is required" }, { status: 400 });
    }
    if (!/^\d{5}$/.test(shipping_address.zip)) {
      return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
    }

    // Fetch variant details for price verification and shipping calc
    const variantIds = items.map((i) => i.variant_id);
    const supabase = getServiceSupabase();
    const { data: variants, error: variantError } = await supabase
      .from("plant_variants")
      .select("id, plant_id, variant_type, price, inventory, reserved, weight_lbs, weight_oz, shipping_override")
      .in("id", variantIds);

    if (variantError) throw variantError;

    const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

    // Validate all variants exist and have sufficient stock
    for (const item of items) {
      const variant = variantMap.get(item.variant_id);
      if (!variant) {
        return NextResponse.json({ error: `Variant ${item.variant_id} not found` }, { status: 400 });
      }
      if (variant.inventory - variant.reserved < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for variant ${item.variant_id}` },
          { status: 409 }
        );
      }
    }

    // Reserve inventory
    const reserved = await reserveInventory(
      items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }))
    );
    if (!reserved) {
      return NextResponse.json(
        { error: "Could not reserve inventory. Some items may no longer be available." },
        { status: 409 }
      );
    }

    // Calculate item total (server-side, from DB prices)
    let itemsTotal = 0;
    for (const item of items) {
      const variant = variantMap.get(item.variant_id)!;
      itemsTotal += variant.price * item.quantity;
    }

    // Calculate shipping
    const cartVariants = items.map((item) => {
      const v = variantMap.get(item.variant_id)!;
      return {
        variant_id: v.id,
        variant_type: v.variant_type,
        quantity: item.quantity,
        weight_lbs: v.weight_lbs ?? 0,
        weight_oz: v.weight_oz ?? 0,
        shipping_override: v.shipping_override,
      };
    });

    const configs = await getShippingConfig();
    const shippingResult = await calculateShipping(cartVariants, configs, shipping_address.zip);
    const shippingCost = shippingResult.total;

    // Total in cents
    const totalAmount = itemsTotal + shippingCost;

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      receipt_email: guest_email,
      metadata: {
        guest_name,
        guest_email,
      },
    });

    // Create order
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const order = await createCheckoutOrder({
      guest_name,
      guest_email,
      stripe_payment_intent_id: paymentIntent.id,
      shipping_cost: shippingCost,
      expires_at: expiresAt,
      shipping_address_street: shipping_address.street,
      shipping_address_city: shipping_address.city,
      shipping_address_state: shipping_address.state,
      shipping_address_zip: shipping_address.zip,
    });

    // Create order items
    for (const item of items) {
      const variant = variantMap.get(item.variant_id)!;
      await createOrderItem(order.id, item.plant_id, item.variant_id, variant.price, item.quantity);
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      order_id: order.id,
      items_total: itemsTotal,
      shipping_cost: shippingCost,
      total: totalAmount,
      shipping_breakdown: shippingResult.breakdown,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "add checkout API route with inventory reservation"
```

---

### Task 6: Checkout update and cleanup API routes

**Files:**
- Create: `src/app/api/checkout/update/route.ts`
- Create: `src/app/api/checkout/cleanup/route.ts`

- [ ] **Step 1: Create the checkout update route**

Create `src/app/api/checkout/update/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { getServiceSupabase } from "@/lib/supabase/server";
import { getShippingConfig } from "@/lib/db/shipping";
import { calculateShipping } from "@/lib/shipping/calculator";
import { getOrderById, updateOrderShipping } from "@/lib/db/orders";
import { getOrderItems } from "@/lib/db/order-items";

type UpdateBody = {
  order_id: number;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
};

export async function POST(request: Request) {
  try {
    const body: UpdateBody = await request.json();
    const { order_id, shipping_address } = body;

    if (!order_id || !shipping_address?.zip) {
      return NextResponse.json({ error: "order_id and shipping_address are required" }, { status: 400 });
    }
    if (!/^\d{5}$/.test(shipping_address.zip)) {
      return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
    }

    const order = await getOrderById(order_id);
    if (!order || order.status !== "pending_payment") {
      return NextResponse.json({ error: "Order not found or not pending" }, { status: 404 });
    }

    // Get order items and variant details for shipping calc
    const orderItems = await getOrderItems(order_id);
    const variantIds = orderItems.map((i) => i.variant_id).filter((id): id is number => id !== null);

    const supabase = getServiceSupabase();
    const { data: variants, error } = await supabase
      .from("plant_variants")
      .select("id, variant_type, weight_lbs, weight_oz, shipping_override")
      .in("id", variantIds);

    if (error) throw error;

    const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

    const cartVariants = orderItems
      .filter((item) => item.variant_id && variantMap.has(item.variant_id))
      .map((item) => {
        const v = variantMap.get(item.variant_id!)!;
        return {
          variant_id: v.id,
          variant_type: v.variant_type,
          quantity: item.quantity,
          weight_lbs: v.weight_lbs ?? 0,
          weight_oz: v.weight_oz ?? 0,
          shipping_override: v.shipping_override,
        };
      });

    const configs = await getShippingConfig();
    const shippingResult = await calculateShipping(cartVariants, configs, shipping_address.zip);
    const shippingCost = shippingResult.total;

    // Recalculate total
    const itemsTotal = orderItems.reduce((sum, i) => sum + i.price_each * i.quantity, 0);
    const totalAmount = itemsTotal + shippingCost;

    // Update Stripe PaymentIntent amount
    await stripe.paymentIntents.update(order.stripe_payment_intent_id!, {
      amount: totalAmount,
    });

    // Update order shipping cost and address
    await supabase
      .from("orders")
      .update({
        shipping_cost: shippingCost,
        shipping_address_street: shipping_address.street,
        shipping_address_city: shipping_address.city,
        shipping_address_state: shipping_address.state,
        shipping_address_zip: shipping_address.zip,
        updated_on: new Date().toISOString(),
      })
      .eq("id", order_id);

    return NextResponse.json({
      shipping_cost: shippingCost,
      total: totalAmount,
      shipping_breakdown: shippingResult.breakdown,
    });
  } catch (err) {
    console.error("Checkout update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the cleanup route**

Create `src/app/api/checkout/cleanup/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { cleanupExpiredReservations } from "@/lib/db/reservations";

export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cleaned = await cleanupExpiredReservations();
    return NextResponse.json({ cleaned });
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create Vercel cron config**

Create `vercel.json` in the project root (or update if it already exists):

```json
{
  "crons": [
    {
      "path": "/api/checkout/cleanup",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

- [ ] **Step 4: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/checkout/update/route.ts src/app/api/checkout/cleanup/route.ts vercel.json
git commit -m "add checkout update and reservation cleanup routes"
```

---

### Task 7: Stripe webhook handler

**Files:**
- Create: `src/app/api/webhook/stripe/route.ts`

- [ ] **Step 1: Create the webhook route**

Create `src/app/api/webhook/stripe/route.ts`:

```typescript
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { getOrderByPaymentIntent, updateOrderStatus } from "@/lib/db/orders";
import { confirmReservation, releaseReservation } from "@/lib/db/reservations";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await getOrderByPaymentIntent(paymentIntent.id);

      if (!order) {
        console.error("No order found for PaymentIntent:", paymentIntent.id);
        break;
      }

      if (order.status !== "pending_payment") {
        // Already processed (idempotent)
        break;
      }

      // Confirm the sale: decrement inventory and reserved
      await confirmReservation(order.id);
      await updateOrderStatus(order.id, "confirmed");
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await getOrderByPaymentIntent(paymentIntent.id);

      if (!order || order.status !== "pending_payment") break;

      // Release reservation and expire the order
      await releaseReservation(order.id);
      await updateOrderStatus(order.id, "expired");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhook/stripe/route.ts
git commit -m "add Stripe webhook handler for payment confirmation"
```

---

### Task 8: Checkout page (UI)

**Files:**
- Create: `src/app/checkout/page.tsx`
- Create: `src/app/checkout/checkout-form.tsx`

- [ ] **Step 1: Create the Stripe Elements wrapper page**

Create `src/app/checkout/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./checkout-form";
import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type CheckoutState = {
  client_secret: string;
  order_id: number;
  items_total: number;
  shipping_cost: number;
  total: number;
  shipping_breakdown: { description: string; amount: number }[];
};

export default function CheckoutPage() {
  const { items } = useCart();
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);

  if (items.length === 0 && !checkoutState) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
          Browse Products
        </Button>
      </div>
    );
  }

  if (checkoutState) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Payment</h1>
        <Elements stripe={stripePromise} options={{ clientSecret: checkoutState.client_secret }}>
          <CheckoutForm checkoutState={checkoutState} />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <AddressForm items={items} onCheckoutReady={setCheckoutState} />
    </div>
  );
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function AddressForm({
  items,
  onCheckoutReady,
}: {
  items: { plant_id: number; variant_id: number; quantity: number }[];
  onCheckoutReady: (state: CheckoutState) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            plant_id: i.plant_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
          guest_name: name,
          guest_email: email,
          shipping_address: { street, city, state, zip },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }

      const data: CheckoutState = await res.json();
      onCheckoutReady(data);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded border bg-background px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Street Address</label>
        <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input type="text" required maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="CA" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP</label>
          <input type="text" required inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} className={inputClass} />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Continue to Payment"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create the Stripe Elements payment form**

Create `src/app/checkout/checkout-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type CheckoutState = {
  order_id: number;
  items_total: number;
  shipping_cost: number;
  total: number;
  shipping_breakdown: { description: string; amount: number }[];
};

export default function CheckoutForm({ checkoutState }: { checkoutState: CheckoutState }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${checkoutState.order_id}`,
      },
    });

    // If we get here, there was an error (successful payments redirect)
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-2">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span>{formatPrice(checkoutState.items_total)}</span>
        </div>
        {checkoutState.shipping_breakdown.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.description}</span>
            <span>{item.amount > 0 ? formatPrice(item.amount) : "N/A"}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatPrice(checkoutState.total)}</span>
        </div>
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Processing payment..." : `Pay ${formatPrice(checkoutState.total)}`}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkout/page.tsx src/app/checkout/checkout-form.tsx
git commit -m "add checkout page with address form and Stripe Elements"
```

---

### Task 9: Order confirmation page

**Files:**
- Create: `src/app/order-confirmation/[id]/page.tsx`

- [ ] **Step 1: Create the confirmation page**

Create `src/app/order-confirmation/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderForConfirmation } from "@/lib/db/orders";
import { getOrderItems } from "@/lib/db/order-items";
import { getServiceSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) notFound();

  const order = await getOrderForConfirmation(orderId);
  if (!order || (order.status !== "confirmed" && order.status !== "pending_payment")) {
    notFound();
  }

  const items = await getOrderItems(orderId);

  // Fetch plant names for display
  const supabase = getServiceSupabase();
  const plantIds = [...new Set(items.map((i) => i.plant_id))];
  const { data: plants } = await supabase
    .from("plants")
    .select("id, cultivar_name")
    .in("id", plantIds);

  const plantMap = new Map((plants ?? []).map((p) => [p.id, p.cultivar_name]));

  const itemsTotal = items.reduce((sum, i) => sum + i.price_each * i.quantity, 0);
  const shippingCost = order.shipping_cost ?? 0;
  const total = itemsTotal + shippingCost;

  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
      <p className="text-muted-foreground mb-8">
        Thank you{order.guest_name ? `, ${order.guest_name}` : ""}. Your order #{order.id} has been placed.
      </p>

      <div className="rounded-lg border p-6 text-left space-y-4 mb-8">
        <h2 className="font-semibold">Items</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {plantMap.get(item.plant_id) ?? "Unknown"} x{item.quantity}
              </span>
              <span>{formatPrice(item.price_each * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {order.shipping_address_street && (
          <div className="border-t pt-2">
            <p className="text-sm text-muted-foreground mb-1">Shipping to:</p>
            <p className="text-sm">
              {order.shipping_address_street}<br />
              {order.shipping_address_city}, {order.shipping_address_state} {order.shipping_address_zip}
            </p>
          </div>
        )}

        {order.guest_email && (
          <p className="text-sm text-muted-foreground border-t pt-2">
            A receipt has been sent to {order.guest_email}.
          </p>
        )}
      </div>

      <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
        Continue Shopping
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/order-confirmation/
git commit -m "add order confirmation page"
```

---

### Task 10: Cart checkout button and clear cart on confirmation

**Files:**
- Modify: `src/app/cart/page.tsx`
- Modify: `src/app/checkout/checkout-form.tsx`

- [ ] **Step 1: Add checkout button to cart page**

In `src/app/cart/page.tsx`, replace the bottom section (the `div` with `className="mt-4 flex items-center justify-between border-t pt-4"`):

Find:
```tsx
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-lg font-bold">Total: {formatPrice(totalPrice)}</span>
        <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
          Continue Shopping
        </Button>
      </div>
```

Replace with:
```tsx
      <div className="mt-4 flex items-center justify-between border-t pt-4">
        <span className="text-lg font-bold">Total: {formatPrice(totalPrice)}</span>
        <div className="flex gap-2">
          <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
            Continue Shopping
          </Button>
          <Button nativeButton={false} render={<Link href="/checkout" />}>
            Checkout
          </Button>
        </div>
      </div>
```

- [ ] **Step 2: Clear cart after successful payment redirect**

In `src/app/checkout/checkout-form.tsx`, the cart is cleared when the user returns to the confirmation page. Since `confirmPayment` redirects on success, we need to clear the cart on the confirmation page. However, the confirmation page is a server component.

Instead, add a `ClearCartOnMount` client component to the confirmation page. Create `src/app/order-confirmation/[id]/clear-cart.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export default function ClearCartOnMount() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
```

Then in `src/app/order-confirmation/[id]/page.tsx`, add the import and component. Add at the top of the imports:

```tsx
import ClearCartOnMount from "./clear-cart";
```

Add `<ClearCartOnMount />` right after the opening `<div>` of the return:

```tsx
    <div className="max-w-lg mx-auto py-16 text-center">
      <ClearCartOnMount />
      <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
```

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/cart/page.tsx src/app/checkout/checkout-form.tsx src/app/order-confirmation/
git commit -m "add checkout button to cart and clear cart on confirmation"
```

---

### Task 11: Update admin orders page for new statuses

**Files:**
- Modify: `src/app/admin/orders/page.tsx`

- [ ] **Step 1: Add new status colors**

In `src/app/admin/orders/page.tsx`, replace the `STATUS_COLORS` object:

Find:
```typescript
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  deleted: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};
```

Replace with:
```typescript
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  deleted: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};
```

- [ ] **Step 2: Update the query to show guest info**

In the same file, update the customer display to handle guest orders. In the table body, find:

```tsx
<td className="px-4 py-3">{order.customers?.name ?? "Unknown"}</td>
```

Replace with:
```tsx
<td className="px-4 py-3">{order.customers?.name ?? order.guest_name ?? "Guest"}</td>
```

Also update the select query to include guest_name. Find:

```typescript
    .select(`
      *,
      customers (name, email),
      order_details (price_each, quantity)
    `)
```

This already uses `*` which includes `guest_name`, so no change needed to the query. The select already fetches all columns from orders.

- [ ] **Step 3: Also update the status display to format pending_payment nicely**

Find the status badge rendering:

```tsx
{order.status}
```

Replace with:
```tsx
{order.status.replace(/_/g, " ")}
```

- [ ] **Step 4: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/orders/page.tsx
git commit -m "add pending_payment and expired status badges to admin orders"
```

---

### Task 12: End-to-end manual testing

**Files:** None (testing only)

- [ ] **Step 1: Set up Stripe test keys**

Create a Stripe account (if not already) at https://dashboard.stripe.com. In test mode, copy:
- `STRIPE_SECRET_KEY` (starts with `sk_test_`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)

Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- [ ] **Step 2: Start dev server and test checkout flow**

```bash
npm run dev
```

1. Browse products, add items to cart
2. Go to cart, click "Checkout"
3. Fill in name, email, shipping address
4. Click "Continue to Payment"
5. Verify order summary shows items + shipping
6. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
7. Submit payment
8. Verify redirect to order confirmation page
9. Verify cart is cleared

- [ ] **Step 3: Test webhook locally with Stripe CLI**

Install Stripe CLI: https://docs.stripe.com/stripe-cli

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Copy the webhook signing secret and add to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart dev server and repeat the checkout flow. Verify in the terminal that the webhook fires and order status changes to "confirmed".

- [ ] **Step 4: Test reservation expiry**

1. Start checkout but do not complete payment
2. Verify in Supabase that `reserved` was incremented on the variant
3. Wait 15 minutes (or manually set `expires_at` to the past in Supabase)
4. Call cleanup: `curl -X POST http://localhost:3000/api/checkout/cleanup`
5. Verify `reserved` was decremented and order status is "expired"

- [ ] **Step 5: Test admin panel**

1. Log in as admin
2. Go to Orders tab
3. Verify new orders show with correct status badges
4. Verify guest orders show guest name

- [ ] **Step 6: Commit any fixes found during testing**

```bash
git add -A
git commit -m "fix issues found during checkout testing"
```

---

### Task 13: Add Stripe env vars to Vercel and deploy

**Files:** None (deployment only)

- [ ] **Step 1: Add env vars to Vercel**

In Vercel dashboard > project > Settings > Environment Variables, add:
- `STRIPE_SECRET_KEY` = your live (or test) secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = your live (or test) publishable key
- `STRIPE_WEBHOOK_SECRET` = (set after creating webhook endpoint in step 3)

- [ ] **Step 2: Push to GitHub**

```bash
git push origin feature/stripe-checkout
```

Vercel will auto-deploy.

- [ ] **Step 3: Create Stripe webhook endpoint**

In Stripe Dashboard > Developers > Webhooks > Add endpoint:
- URL: `https://raresucculentinventory.com/api/webhook/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Vercel env vars. Redeploy.

- [ ] **Step 4: Test live checkout**

Repeat the checkout flow on the deployed site using Stripe test mode cards to verify everything works end to end.
