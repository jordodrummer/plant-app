import { getCategories } from "@/lib/db/categories";
import ProductForm from "../product-form";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">New Plant</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
