import Link from "next/link";
import CartIcon from "@/components/cart-icon";
import AuthButton from "@/components/auth-button";
import { ThemeToggle } from "@/components/theme-toggle";
import AdminLink from "@/components/admin-link";
import MobileMenu from "@/components/mobile-menu";

export default function Nav() {
  return (
    <nav className="relative border-b">
      <div className="container mx-auto flex items-center gap-4 px-4 py-3 sm:gap-6">
        <Link href="/" className="shrink-0 text-lg font-semibold">
          Rare Succulent Inventory
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            Products
          </Link>
          <AdminLink />
        </div>
        <div className="ml-auto hidden items-center gap-4 sm:flex">
          <ThemeToggle />
          <AuthButton />
          <CartIcon />
        </div>
        <div className="ml-auto flex items-center gap-3 sm:hidden">
          <CartIcon />
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
