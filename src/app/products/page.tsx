import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getItems } from "@/lib/db/items";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const plants = await getItems();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <Card key={plant.id}>
            <CardHeader>
              <CardTitle>{plant.cultivar_name}</CardTitle>
            </CardHeader>
            {plant.image && (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={plant.image}
                  alt={plant.cultivar_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardContent>
              <p className="text-muted-foreground mb-4">{plant.details}</p>
              <div className="flex items-center justify-between">
                <span className="font-semibold">${plant.price}</span>
                <Button nativeButton={false} render={<Link href={`/products/${plant.id}`} />} variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
