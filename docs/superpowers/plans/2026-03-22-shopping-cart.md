# Shopping Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side shopping cart with localStorage persistence, add-to-cart on product pages, cart icon in nav, and a full cart page.

**Architecture:** Cart state managed via React context with localStorage sync. A `CartProvider` wraps the app at the layout level. Interactive components (`"use client"`) consume the context; server components pass plant data as props to client components.

**Tech Stack:** React context, localStorage, Next.js App Router, shadcn/ui (Button, Card), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-22-shopping-cart-design.md`

**IMPORTANT:** Do not modify or delete any files in `plantInventory/` or `plantInventoryServer/`. These are kept for reference.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/types.ts` | Modify | Add `CartItem` type |
| `src/lib/cart-context.tsx` | Create | CartProvider + useCart hook |
| `src/app/layout.tsx` | Modify | Wrap children with CartProvider |
| `src/components/add-to-cart-button.tsx` | Create | Add to Cart button for product pages |
| `src/app/products/[productId]/page.tsx` | Modify | Add AddToCartButton component |
| `src/components/cart-icon.tsx` | Create | Nav cart icon with item count badge |
| `src/components/nav.tsx` | Modify | Add CartIcon (stays server component) |
| `src/app/cart/page.tsx` | Create | Cart page with items, quantities, totals |

---

### Task 1: Add CartItem type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add CartItem type to types.ts**

Add at the end of `src/lib/types.ts`:

```typescript
export type CartItem = {
  plant_id: number;
  cultivar_name: string;
  price: number;
  quantity: number;
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "add CartItem type"
```

---

### Task 2: Cart context with localStorage persistence

**Files:**
- Create: `src/lib/cart-context.tsx`

- [ ] **Step 1: Create the cart context provider**

Create `src/lib/cart-context.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem } from "./types";

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (plantId: number) => void;
  updateQuantity: (plantId: number, quantity: number) => void;
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
    return stored ? JSON.parse(stored) : [];
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
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveCart(items);
    }
  }, [items, mounted]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.plant_id === item.plant_id);
      if (existing) {
        return prev.map((i) =>
          i.plant_id === item.plant_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((plantId: number) => {
    setItems((prev) => prev.filter((i) => i.plant_id !== plantId));
  }, []);

  const updateQuantity = useCallback((plantId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.plant_id !== plantId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.plant_id === plantId ? { ...i, quantity } : i
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cart-context.tsx
git commit -m "add cart context with localStorage persistence"
```

---

### Task 3: Wrap app with CartProvider

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

The root layout is a server component. Since `CartProvider` is a `"use client"` component, it can be imported and used as a wrapper — Next.js allows server components to render client components as children.

Replace the contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/nav";
import { CartProvider } from "@/lib/cart-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cactus Shop",
  description: "Plant inventory management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Nav />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "wrap app with CartProvider"
```

---

### Task 4: Add to Cart button

**Files:**
- Create: `src/components/add-to-cart-button.tsx`
- Modify: `src/app/products/[productId]/page.tsx`

- [ ] **Step 1: Create the AddToCartButton component**

Create `src/components/add-to-cart-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

type Props = {
  plant_id: number;
  cultivar_name: string;
  price: number;
  in_stock: boolean;
};

export default function AddToCartButton({ plant_id, cultivar_name, price, in_stock }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ plant_id, cultivar_name, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <Button
      onClick={handleClick}
      disabled={!in_stock || added}
    >
      {added ? "Added!" : in_stock ? "Add to Cart" : "Out of Stock"}
    </Button>
  );
}
```

- [ ] **Step 2: Add the button to the product detail page**

In `src/app/products/[productId]/page.tsx`, add the import and render the button.

Add import at the top:
```tsx
import AddToCartButton from "@/components/add-to-cart-button";
```

Add the button after the price/stock `div` (after line 46), inside CardContent:
```tsx
        <AddToCartButton
          plant_id={plant.id}
          cultivar_name={plant.cultivar_name}
          price={plant.price}
          in_stock={plant.in_stock}
        />
```

The full CardContent should look like:
```tsx
      <CardContent className="space-y-4">
        {category && (
          <p className="text-sm text-muted-foreground">
            Category: {category.name}
          </p>
        )}
        <p>{plant.details}</p>
        <div className="flex gap-4">
          <span className="font-semibold text-lg">${plant.price}</span>
          <span className={plant.in_stock ? "text-green-600" : "text-red-500"}>
            {plant.in_stock ? `In stock (${plant.inventory})` : "Out of stock"}
          </span>
        </div>
        <AddToCartButton
          plant_id={plant.id}
          cultivar_name={plant.cultivar_name}
          price={plant.price}
          in_stock={plant.in_stock}
        />
      </CardContent>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/add-to-cart-button.tsx src/app/products/\[productId\]/page.tsx
git commit -m "add Add to Cart button on product detail page"
```

---

### Task 5: Cart icon in nav

**Files:**
- Create: `src/components/cart-icon.tsx`
- Modify: `src/components/nav.tsx`

- [ ] **Step 1: Create the CartIcon component**

Create `src/components/cart-icon.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="relative text-sm text-muted-foreground hover:text-foreground">
      Cart
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-4 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Update nav to include CartIcon**

Replace the contents of `src/components/nav.tsx` with:

```tsx
import Link from "next/link";
import CartIcon from "@/components/cart-icon";

export default function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Cactus Shop
        </Link>
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
          Products
        </Link>
        <div className="ml-auto">
          <CartIcon />
        </div>
      </div>
    </nav>
  );
}
```

Note: Nav itself stays a server component — it just renders the `CartIcon` client component. No `"use client"` directive needed on nav.tsx.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/cart-icon.tsx src/components/nav.tsx
git commit -m "add cart icon with item count badge to nav"
```

---

### Task 6: Cart page

**Files:**
- Create: `src/app/cart/page.tsx`

- [ ] **Step 1: Create the cart page**

Create `src/app/cart/page.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

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
          <Card key={item.plant_id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-semibold">{item.cultivar_name}</p>
                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.plant_id, item.quantity - 1)}
                >
                  −
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.plant_id, item.quantity + 1)}
                >
                  +
                </Button>
                <span className="w-16 text-right font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.plant_id)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <span className="text-lg font-bold">Total: ${totalPrice.toFixed(2)}</span>
        <Button nativeButton={false} render={<Link href="/products" />} variant="outline">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Verify lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/cart/page.tsx
git commit -m "add cart page with quantity controls and totals"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Manual testing with dev server**

```bash
npm run dev
```

Test:
- Visit `/products/1` — "Add to Cart" button visible, click it, see "Added!" feedback
- Visit `/products/4` (Pachanoi, out of stock) — button shows "Out of Stock", disabled
- Nav shows cart badge with item count
- Visit `/cart` — item listed with quantity controls, total shown
- Click +/- to change quantity, click Remove to delete item
- Click "Clear Cart" to empty cart
- Refresh browser — cart persists from localStorage
- Empty cart shows "Your cart is empty" with link to products

- [ ] **Step 4: Final commit if cleanup needed**

Only commit if there are actual changes:

```bash
git add src/
git commit -m "cart feature cleanup"
```
