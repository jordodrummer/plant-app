import Link from "next/link";
import CartIcon from "@/components/cart-icon";

export default function Nav() {
  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center gap-6 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Rare Cactus &amp; Succulent Inventory
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
