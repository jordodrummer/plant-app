import { notFound } from "next/navigation";
import { getItemById } from "@/lib/db/items";
import { getCategoryById } from "@/lib/db/categories";
import { getVariantsByPlantId } from "@/lib/db/variants";
import { getImagesByPlantId } from "@/lib/db/images";
import ImageGallery from "@/components/image-gallery";
import VariantSelector from "@/components/variant-selector";
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
  return { title: `${plant.cultivar_name} | Rare Succulent Inventory` };
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const id = Number(productId);
  const [plant, variants, images] = await Promise.all([
    getItemById(id),
    getVariantsByPlantId(id),
    getImagesByPlantId(id),
  ]);

  if (!plant) {
    notFound();
  }

  const category = await getCategoryById(plant.category_id);

  return (
    <div className="mx-auto max-w-3xl">
      <ImageGallery images={images} alt={plant.cultivar_name} />
      <div className="mt-6 space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{plant.cultivar_name}</h1>
          {category && (
            <p className="text-sm text-muted-foreground">
              Category: {category.name}
            </p>
          )}
          {plant.details && (
            <p className="mt-2 text-muted-foreground">{plant.details}</p>
          )}
        </div>
        <VariantSelector
          variants={variants}
          plantId={plant.id}
          cultivarName={plant.cultivar_name}
        />
        <ImageUpload plantId={plant.id} />
      </div>
    </div>
  );
}
