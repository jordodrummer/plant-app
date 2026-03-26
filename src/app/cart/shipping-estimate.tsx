"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Breakdown = {
  description: string;
  amount: number;
};

export default function ShippingEstimate() {
  const { items } = useCart();
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCalculate() {
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a valid 5-digit ZIP code");
      return;
    }

    setLoading(true);
    setError(null);
    setBreakdown(null);
    setTotal(null);

    const res = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destination_zip: zip,
        items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      }),
    });

    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setBreakdown(data.breakdown);
      setTotal(data.total);
    } else {
      setError("Could not calculate shipping. Please try again.");
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold">Shipping Estimate</h2>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
          className="w-28 rounded border bg-background px-3 py-2 text-sm"
        />
        <Button size="sm" onClick={handleCalculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {breakdown && total != null && (
        <div className="mt-3 space-y-1">
          {breakdown.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.description}</span>
              <span>{item.amount > 0 ? formatPrice(item.amount) : "N/A"}</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1 text-sm font-semibold">
            <span>Shipping Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
