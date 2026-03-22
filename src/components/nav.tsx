import Link from "next/link";

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
      </div>
    </nav>
  );
}
