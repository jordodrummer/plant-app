import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItems } from "@/lib/db/items";
import PlantPlaceholder from "@/components/plant-placeholder";

export const dynamic = "force-dynamic";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

export default async function ProductsPage() {
  const plants = await getItems();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <Card key={plant.id} className="relative transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>
                <Link href={`/products/${plant.id}`} className="after:absolute after:inset-0">
                  {plant.cultivar_name}
                </Link>
              </CardTitle>
            </CardHeader>
            {plant.primary_image_url ? (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={plant.primary_image_url}
                  alt={plant.cultivar_name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <PlantPlaceholder />
            )}
            <CardContent>
              <p className="text-muted-foreground mb-2">{plant.details}</p>
              {plant.min_price != null && (
                <span className="font-semibold">
                  {plant.variant_count > 1 ? "From " : ""}
                  {formatPrice(plant.min_price)}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
