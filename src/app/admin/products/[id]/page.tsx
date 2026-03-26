import { notFound } from "next/navigation";
import { getItemById } from "@/lib/db/items";
import { getVariantsByPlantId } from "@/lib/db/variants";
import { getImagesByPlantId } from "@/lib/db/images";
import { getCategories } from "@/lib/db/categories";
import ProductForm from "../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plantId = Number(id);

  const [plant, variants, images, categories] = await Promise.all([
    getItemById(plantId),
    getVariantsByPlantId(plantId),
    getImagesByPlantId(plantId),
    getCategories(),
  ]);

  if (!plant) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Edit: {plant.cultivar_name}</h1>
      <ProductForm plant={plant} variants={variants} images={images} categories={categories} />
    </div>
  );
}
