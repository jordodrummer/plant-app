"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function CartIcon() {
  const { totalItems } = useCart();
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Link href="/cart" className="relative text-sm text-muted-foreground hover:text-foreground">
      Cart
      {mounted && totalItems > 0 && (
        <span className="absolute -top-2 -right-4 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
