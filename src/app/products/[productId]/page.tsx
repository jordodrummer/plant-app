import { notFound } from "next/navigation";
import Image from "next/image";
import { getItemById } from "@/lib/db/items";
import { getCategoryById } from "@/lib/db/categories";
import AddToCartButton from "@/components/add-to-cart-button";
import ImageUpload from "@/components/image-upload";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ productId: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));
  if (!plant) return { title: "Product Not Found" };
  return { title: `${plant.cultivar_name} | Rare Cactus and Succulent Inventory` };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const plant = await getItemById(Number(productId));

  if (!plant) {
    notFound();
  }

  const category = await getCategoryById(plant.category_id);

  return (
    <div className="mx-auto max-w-3xl">
      {plant.image && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={plant.image}
            alt={plant.cultivar_name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{plant.cultivar_name}</h1>
          {category && (
            <p className="text-sm text-muted-foreground">
              Category: {category.name}
            </p>
          )}
          <p className="text-muted-foreground">{plant.details}</p>
          <div className="flex items-center gap-3 pt-2">
            <span className="text-2xl font-bold">${plant.price}</span>
            <span className={plant.in_stock ? "text-green-600" : "text-red-500"}>
              {plant.in_stock ? `In stock (${plant.inventory})` : "Out of stock"}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <AddToCartButton
            plant_id={plant.id}
            cultivar_name={plant.cultivar_name}
            price={plant.price}
            in_stock={plant.in_stock}
          />
          <ImageUpload plantId={plant.id} />
        </div>
      </div>
    </div>
  );
}
