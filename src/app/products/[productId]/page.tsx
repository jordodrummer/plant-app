import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemById } from "@/lib/db/items";
import { getCategoryById } from "@/lib/db/categories";
import AddToCartButton from "@/components/add-to-cart-button";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ productId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));
  if (!plant) return { title: "Product Not Found" };
  return { title: `${plant.cultivar_name} | Cactus Shop` };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));

  if (!plant) {
    notFound();
  }

  const category = await getCategoryById(plant.category_id);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-3xl">{plant.cultivar_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {category && (
          <p className="text-sm text-muted-foreground">
            Category: {category.name}
          </p>
        )}
        <p>{plant.details}</p>
        <div className="flex gap-4">
          <span className="font-semibold text-lg">${plant.price}</span>
          <span className={plant.in_stock ? "text-green-600" : "text-red-500"}>
            {plant.in_stock ? `In stock (${plant.inventory})` : "Out of stock"}
          </span>
        </div>
        <AddToCartButton
          plant_id={plant.id}
          cultivar_name={plant.cultivar_name}
          price={plant.price}
          in_stock={plant.in_stock}
        />
      </CardContent>
    </Card>
  );
}
