"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import type { PlantVariant, VariantType } from "@/lib/types";

const VARIANT_TYPE_LABELS: Record<VariantType, string> = {
  cutting: "Cutting",
  rooted_cutting: "Rooted Cutting",
  cut_to_order: "Cut to Order",
  mother_stand: "Mother Stand",
  seedling: "Seedling",
  op_seeds: "OP Seeds",
  hybrid_seeds: "Hybrid Seeds",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

type Props = {
  variants: PlantVariant[];
  plantId: number;
  cultivarName: string;
};

export default function VariantSelector({ variants, plantId, cultivarName }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Available Options</h2>
      {variants.map((variant) => (
        <VariantRow
          key={variant.id}
          variant={variant}
          plantId={plantId}
          cultivarName={cultivarName}
        />
      ))}
    </div>
  );
}

function VariantRow({
  variant,
  plantId,
  cultivarName,
}: {
  variant: PlantVariant;
  plantId: number;
  cultivarName: string;
}) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const label = variant.label || VARIANT_TYPE_LABELS[variant.variant_type];
  const cartItem = items.find((i) => i.variant_id === variant.id);
  const currentInCart = cartItem?.quantity ?? 0;
  const maxCanAdd = variant.inventory - currentInCart;
  const outOfStock = variant.inventory <= 0 || maxCanAdd <= 0;

  function handleAdd() {
    addItem({
      plant_id: plantId,
      variant_id: variant.id,
      cultivar_name: cultivarName,
      variant_type: variant.variant_type,
      variant_label: label,
      price: variant.price,
      max_quantity: variant.inventory,
      quantity,
    });
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-lg font-bold">{formatPrice(variant.price)}</p>
          {variant.inventory > 0 ? (
            <p className="text-sm text-green-600">{variant.inventory} available</p>
          ) : (
            <p className="text-sm text-red-500">Out of stock</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {!outOfStock && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => Math.min(maxCanAdd, q + 1))}
                disabled={quantity >= maxCanAdd}
              >
                +
              </Button>
            </div>
          )}
          <Button onClick={handleAdd} disabled={outOfStock || added} className="w-full">
            {added ? "Added!" : outOfStock ? (variant.inventory <= 0 ? "Out of Stock" : "Max in Cart") : "Add to Cart"}
          </Button>
        </div>
      </div>
      {currentInCart > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{currentInCart} already in cart</p>
      )}
      {variant.note && (
        <p className="mt-2 text-sm text-muted-foreground italic">{variant.note}</p>
      )}
    </div>
  );
}
