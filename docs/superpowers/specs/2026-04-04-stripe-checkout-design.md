# Stripe Checkout Design

## Overview

Embedded Stripe Elements checkout with inventory reservation for the rare succulent store. Supports guest checkout (no sign-in required). Inventory is held for 15 minutes using a `reserved` column on `plant_variants`.

## Checkout Flow

1. Customer clicks "Checkout" on cart page
2. Client collects shipping address, then sends cart items + address to `POST /api/checkout`
3. Server validates stock (`quantity - reserved >= requested`), reserves inventory, creates order with status `pending_payment` and `expires_at` = now + 15 min, calculates shipping from full address, creates Stripe PaymentIntent for items + shipping total
4. Returns `client_secret` + order ID to client
5. Checkout page renders Stripe Elements card input using client secret
6. On address change, recalculate shipping via existing `POST /api/shipping/rates` and update PaymentIntent amount via `POST /api/checkout/update`
7. Customer submits payment through Stripe Elements
8. Stripe webhook (`POST /api/webhook/stripe`) fires on `payment_intent.succeeded`: decrements `quantity` and `reserved` on variants, updates order status to `confirmed`
9. Customer redirected to `/order-confirmation/[id]`
10. Stripe sends automatic email receipt to customer

## Inventory Reservation

- `plant_variants` gets a `reserved INTEGER DEFAULT 0` column
- Available stock = `quantity - reserved`
- On checkout start: atomically increment `reserved` (with check that `quantity - reserved >= requested`)
- On payment success (webhook): decrement both `quantity` and `reserved`
- On expiry (15 min) or abandonment: decrement `reserved`, set order status to `expired`
- Cleanup endpoint `POST /api/checkout/cleanup` runs via Vercel cron every 5 minutes

## Guest Checkout

- No sign-in required to purchase
- Checkout collects: name, email, shipping address (street, city, state, zip)
- Guest info stored on the order itself (`guest_name`, `guest_email` fields)
- If a signed-in user checks out, link to their customer record instead
- Future: link guest orders to account if they sign up later (match by email)

## Database Changes

### plant_variants (alter)

- Add `reserved INTEGER DEFAULT 0`

### orders (alter)

- Add `stripe_payment_intent_id TEXT`
- Add `shipping_cost INTEGER` (cents)
- Add `expires_at TIMESTAMPTZ`
- Add `guest_email TEXT`
- Add `guest_name TEXT`

### Order statuses

Existing: `pending`, `confirmed`, `shipped`, `delivered`, `deleted`
New: `pending_payment`, `expired`

## New Files

### Pages

- `src/app/checkout/page.tsx` - Client component. Address form (name, email, street, city, state, zip) + Stripe Elements card input. Two-phase: collect address first to calculate shipping, then show total and payment form.
- `src/app/order-confirmation/[id]/page.tsx` - Server component. Shows order number, items, shipping cost, total, and confirmation message.

### API Routes

- `src/app/api/checkout/route.ts` - POST: validate stock, reserve inventory, create order + order_details, calculate shipping, create PaymentIntent. Returns `{ client_secret, order_id, shipping_cost, total }`.
- `src/app/api/checkout/update/route.ts` - POST: update PaymentIntent amount when shipping address changes. Accepts order_id + new address, recalculates shipping, updates PaymentIntent.
- `src/app/api/checkout/cleanup/route.ts` - POST: find orders where status = `pending_payment` and `expires_at < now()`, release reservations, set status to `expired`.
- `src/app/api/webhook/stripe/route.ts` - POST: Stripe webhook handler. Verifies signature, handles `payment_intent.succeeded` (confirm order, decrement stock) and `payment_intent.payment_failed` (release reservation, expire order).

### Library

- `src/lib/stripe/client.ts` - Server-side Stripe SDK instance using `STRIPE_SECRET_KEY`.
- `src/lib/db/reservations.ts` - Functions: `reserveInventory(items)`, `releaseReservation(orderId)`, `cleanupExpiredReservations()`.

## Changes to Existing Files

- `src/app/cart/page.tsx` - Add "Checkout" button that navigates to `/checkout`
- `src/lib/types.ts` - Add `pending_payment` and `expired` to status types, add Stripe-related fields to Order type
- `src/lib/db/variants.ts` - Add `reserveVariants(items)` and `releaseVariants(items)` with atomic checks
- `src/lib/db/orders.ts` - Update `createOrder` to accept new fields (stripe_payment_intent_id, shipping_cost, expires_at, guest_email, guest_name), add `getOrderByPaymentIntent(id)`, add `getOrderForConfirmation(id)` (public, limited fields)
- `src/app/admin/orders/page.tsx` - Handle `pending_payment` and `expired` status badges

## Environment Variables

- `STRIPE_SECRET_KEY` - Stripe secret key (server-side only)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (client-side)
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint signing secret

## Security

- Webhook endpoint verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
- PaymentIntent created server-side only, client never sees secret key
- Amount calculated server-side (no client-supplied totals)
- Reservation atomicity via PostgreSQL: `UPDATE plant_variants SET reserved = reserved + $1 WHERE id = $2 AND quantity - reserved >= $1`
- Checkout cleanup endpoint secured (cron secret or internal-only)

## Future Enhancements (not in scope)

- Custom branded order confirmation emails (Resend/SendGrid)
- Local pickup shipping option
- Saved payment methods for returning customers
- Order history page for signed-in customers
