# Shopping Cart Design

## Overview

Add a client-side shopping cart to the plant inventory app. Cart state lives in React context with localStorage persistence. No database involvement — cart is purely browser-side until a future checkout feature is built.

## Cart State

**CartItem type** (added to `src/lib/types.ts`):
```typescript
type CartItem = {
  plant_id: number;
  cultivar_name: string;
  price: number;
  quantity: number;
};
```

**Cart context** (`src/lib/cart-context.tsx`):
- `"use client"` provider wrapping the app via root layout
- State: `CartItem[]` stored in `useState`, synced to `localStorage` key `"cart"`
- On mount: reads from localStorage. On every change: writes back to localStorage.
- Exposed interface:
  - `items: CartItem[]`
  - `addItem(item: Omit<CartItem, "quantity">): void` — adds item with quantity 1, or increments if already in cart
  - `removeItem(plantId: number): void` — removes item entirely
  - `updateQuantity(plantId: number, quantity: number): void` — sets quantity, removes if 0
  - `clearCart(): void` — empties cart
  - `totalPrice: number` — sum of price * quantity
  - `totalItems: number` — sum of quantities
- Custom hook: `useCart()` for consuming components

## UI Changes

### Add to Cart Button
- New client component: `src/components/add-to-cart-button.tsx`
- Receives plant data as props (`{ plant_id, cultivar_name, price, in_stock }`)
- Renders a Button that calls `addItem()` from cart context
- Disabled when `in_stock` is false
- Shows brief confirmation feedback on click (e.g., button text changes to "Added!" for 1 second)

### Cart Icon in Nav
- New client component: `src/components/cart-icon.tsx`
- Shows shopping cart icon with badge showing `totalItems` count
- Links to `/cart`
- Badge hidden when cart is empty

### Nav Update
- `src/components/nav.tsx` becomes a client component (needs cart context)
- Adds `CartIcon` next to the existing links

### Product Detail Page Update
- `src/app/products/[productId]/page.tsx` adds `AddToCartButton` below the price/stock info
- Passes plant data as props to the client component, mapping `plant.id` to `plant_id`

### Cart Page (`/cart`)
- New page: `src/app/cart/page.tsx` — `"use client"` component
- Shows list of cart items, each with:
  - Plant name
  - Unit price
  - Quantity controls (- / count / +)
  - Remove button
  - Line total (price * quantity)
- Cart total at the bottom
- "Continue Shopping" link to `/products`
- Empty state: message + link to products when cart is empty
- Uses shadcn/ui Card, Button components

## New Files
- `src/lib/cart-context.tsx` — CartProvider + useCart hook
- `src/components/add-to-cart-button.tsx` — Add to Cart button
- `src/components/cart-icon.tsx` — Nav cart icon with badge
- `src/app/cart/page.tsx` — Cart page

## Modified Files
- `src/lib/types.ts` — add CartItem type
- `src/app/layout.tsx` — wrap children with CartProvider
- `src/app/products/[productId]/page.tsx` — add AddToCartButton
- `src/components/nav.tsx` — add CartIcon, convert to client component

## Dependencies
No new packages needed. Uses existing shadcn/ui components (Button, Card). localStorage is a browser API.
