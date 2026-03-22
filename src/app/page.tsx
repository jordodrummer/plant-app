import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <h1 className="text-4xl font-bold">Welcome to the Cactus Shop</h1>
      <p className="text-muted-foreground text-lg">
        Browse our plant inventory
      </p>
      <Button nativeButton={false} render={<Link href="/products" />}>
        View Products
      </Button>
    </div>
  );
}
