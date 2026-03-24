"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

type Props = {
  plant_id: number;
  cultivar_name: string;
  price: number;
  in_stock: boolean;
  inventory: number;
};

export default function AddToCartButton({ plant_id, cultivar_name, price, in_stock, inventory }: Props) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const cartItem = items.find((i) => i.plant_id === plant_id);
  const currentInCart = cartItem?.quantity ?? 0;
  const maxCanAdd = inventory - currentInCart;

  function handleClick() {
    addItem({ plant_id, cultivar_name, price, max_quantity: inventory, quantity });
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1000);
  }

  function decrement() {
    setQuantity((q) => Math.max(1, q - 1));
  }

  function increment() {
    setQuantity((q) => Math.min(maxCanAdd, q + 1));
  }

  if (!in_stock || maxCanAdd <= 0) {
    return (
      <Button disabled>
        {!in_stock ? "Out of Stock" : "Max in Cart"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={decrement} disabled={quantity <= 1}>
          -
        </Button>
        <span className="w-8 text-center text-sm font-medium">{quantity}</span>
        <Button variant="outline" size="sm" onClick={increment} disabled={quantity >= maxCanAdd}>
          +
        </Button>
      </div>
      <Button onClick={handleClick} disabled={added}>
        {added ? "Added!" : `Add to Cart`}
      </Button>
      {currentInCart > 0 && (
        <p className="text-xs text-muted-foreground">{currentInCart} already in cart</p>
      )}
    </div>
  );
}
