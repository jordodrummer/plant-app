"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ImageUpload from "@/components/image-upload";
import type { Plant, PlantVariant, PlantImage, Category, VariantType } from "@/lib/types";

const VARIANT_TYPES: VariantType[] = [
  "cutting", "rooted_cutting", "cut_to_order", "mother_stand",
  "seedling", "op_seeds", "hybrid_seeds",
];

type VariantRow = {
  id?: number;
  variant_type: VariantType;
  price: string;
  inventory: string;
  label: string;
  note: string;
  sort_order: number;
};

type Props = {
  plant?: Plant;
  variants?: PlantVariant[];
  images?: PlantImage[];
  categories: Category[];
};

export default function ProductForm({ plant, variants, images, categories }: Props) {
  const router = useRouter();
  const isEdit = !!plant;

  const [cultivarName, setCultivarName] = useState(plant?.cultivar_name ?? "");
  const [categoryId, setCategoryId] = useState(plant?.category_id?.toString() ?? "");
  const [details, setDetails] = useState(plant?.details ?? "");
  const [inStock, setInStock] = useState(plant?.in_stock ?? false);
  const [variantRows, setVariantRows] = useState<VariantRow[]>(
    variants?.map((v) => ({
      id: v.id,
      variant_type: v.variant_type,
      price: v.price.toString(),
      inventory: v.inventory.toString(),
      label: v.label ?? "",
      note: v.note ?? "",
      sort_order: v.sort_order,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addVariantRow() {
    setVariantRows([
      ...variantRows,
      {
        variant_type: "cutting",
        price: "0",
        inventory: "0",
        label: "",
        note: "",
        sort_order: variantRows.length,
      },
    ]);
  }

  function updateVariantRow(index: number, field: keyof VariantRow, value: string) {
    const rows = [...variantRows];
    rows[index] = { ...rows[index], [field]: value };
    setVariantRows(rows);
  }

  function removeVariantRow(index: number) {
    setVariantRows(variantRows.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Save plant
      const plantBody = {
        cultivar_name: cultivarName,
        category_id: Number(categoryId),
        details: details || null,
        in_stock: inStock,
      };

      let plantId = plant?.id;

      if (isEdit) {
        const res = await fetch(`/api/plants/${plantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantBody),
        });
        if (!res.ok) throw new Error("Failed to update plant");
      } else {
        const res = await fetch("/api/plants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(plantBody),
        });
        if (!res.ok) throw new Error("Failed to create plant");
        const created = await res.json();
        plantId = created.id;
      }

      // Save variants
      for (const row of variantRows) {
        const variantBody = {
          plant_id: plantId,
          variant_type: row.variant_type,
          price: parseFloat(row.price),
          inventory: parseInt(row.inventory, 10),
          label: row.label || null,
          note: row.note || null,
          sort_order: row.sort_order,
        };

        if (row.id) {
          await fetch(`/api/variants/${row.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variantBody),
          });
        } else {
          await fetch("/api/variants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variantBody),
          });
        }
      }

      // Delete removed variants
      if (isEdit && variants) {
        const keepIds = new Set(variantRows.filter((r) => r.id).map((r) => r.id));
        for (const v of variants) {
          if (!keepIds.has(v.id)) {
            await fetch(`/api/variants/${v.id}`, { method: "DELETE" });
          }
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!plant || !confirm("Delete this plant and all its variants and images?")) return;
    setSaving(true);
    const res = await fetch(`/api/plants/${plant.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError("Failed to delete plant");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Plant Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Cultivar Name</label>
            <input
              required
              value={cultivarName}
              onChange={(e) => setCultivarName(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full rounded border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
          />
          In Stock
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Variants</h2>
        {variantRows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Type</label>
              <select
                value={row.variant_type}
                onChange={(e) => updateVariantRow(i, "variant_type", e.target.value)}
                className="rounded border bg-background px-2 py-1.5 text-sm"
              >
                {VARIANT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={row.price}
                onChange={(e) => updateVariantRow(i, "price", e.target.value)}
                className="w-24 rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Stock</label>
              <input
                type="number"
                min="0"
                value={row.inventory}
                onChange={(e) => updateVariantRow(i, "inventory", e.target.value)}
                className="w-20 rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">Label</label>
              <input
                value={row.label}
                onChange={(e) => updateVariantRow(i, "label", e.target.value)}
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeVariantRow(i)}
              className="text-destructive"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addVariantRow}>
          + Add Variant
        </Button>
      </section>

      {isEdit && plant && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Images</h2>
          {images && images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt={img.caption ?? ""}
                    className="h-20 w-20 rounded-lg border object-cover"
                  />
                  <span className="mt-1 block text-center text-xs text-muted-foreground">
                    {img.image_type}
                  </span>
                </div>
              ))}
            </div>
          )}
          <ImageUpload plantId={plant.id} />
        </section>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Plant"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={saving}
            className="ml-auto"
          >
            Delete Plant
          </Button>
        )}
      </div>
    </form>
  );
}
