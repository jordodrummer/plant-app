"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

type Props = {
  plant_id: number;
  cultivar_name: string;
  price: number;
  in_stock: boolean;
};

export default function AddToCartButton({ plant_id, cultivar_name, price, in_stock }: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ plant_id, cultivar_name, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  }

  return (
    <Button
      onClick={handleClick}
      disabled={!in_stock || added}
    >
      {added ? "Added!" : in_stock ? "Add to Cart" : "Out of Stock"}
    </Button>
  );
}
