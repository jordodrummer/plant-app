import Link from "next/link";
import { getItems } from "@/lib/db/items";
import { getCategories } from "@/lib/db/categories";
import { Button } from "@/components/ui/button";

export default async function AdminProductsPage() {
  const [plants, categories] = await Promise.all([getItems(), getCategories()]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Products</h1>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          + New Plant
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Variants</th>
              <th className="px-4 py-3 text-left font-medium">In Stock</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((plant) => (
              <tr key={plant.id} className="border-b">
                <td className="px-4 py-3 font-medium">{plant.cultivar_name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {categoryMap.get(plant.category_id) ?? "Unknown"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {plant.variant_count} variant{plant.variant_count !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <span className={plant.in_stock ? "text-green-600" : "text-muted-foreground"}>
                    {plant.in_stock ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${plant.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {plants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No products yet. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
