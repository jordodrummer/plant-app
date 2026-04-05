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
