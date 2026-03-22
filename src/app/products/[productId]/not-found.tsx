import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <h1 className="text-2xl font-bold">Product Not Found</h1>
      <p className="text-muted-foreground">
        The product you are looking for does not exist.
      </p>
      <Button nativeButton={false} variant="outline" render={<Link href="/products" />}>
        Back to Products
      </Button>
    </div>
  );
}
