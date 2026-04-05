"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ShippingConfig, VariantType } from "@/lib/types";

const VARIANT_TYPE_LABELS: Record<VariantType, string> = {
  cutting: "Cutting",
  rooted_cutting: "Rooted Cutting",
  cut_to_order: "Cut to Order",
  mother_stand: "Mother Stand",
  seedling: "Seedling",
  op_seeds: "OP Seeds",
  hybrid_seeds: "Hybrid Seeds",
  special: "Special",
};

function centsToStr(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function strToCents(str: string): number | null {
  const val = parseFloat(str);
  if (isNaN(val)) return null;
  return Math.round(val * 100);
}

export default function ShippingConfigForm({ configs }: { configs: ShippingConfig[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    configs.map((c) => ({
      variant_type: c.variant_type,
      method: c.method,
      base_price: centsToStr(c.base_price),
      additional_price: centsToStr(c.additional_price),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateRow(index: number, field: string, value: string) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "method" && value === "realtime") {
      updated[index].base_price = "";
      updated[index].additional_price = "";
    }
    setRows(updated);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const body = rows.map((r) => ({
      variant_type: r.variant_type,
      method: r.method,
      base_price: r.method === "flat" ? strToCents(r.base_price) : null,
      additional_price: r.method === "flat" ? strToCents(r.additional_price) : null,
    }));

    const res = await fetch("/api/shipping/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 2000);
    } else {
      setError("Failed to save shipping config");
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">Saved!</p>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Variant Type</th>
              <th className="px-4 py-3 text-left font-medium">Method</th>
              <th className="px-4 py-3 text-left font-medium">Base Price ($)</th>
              <th className="px-4 py-3 text-left font-medium">Additional Item ($)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.variant_type} className="border-b">
                <td className="px-4 py-3 font-medium">
                  {VARIANT_TYPE_LABELS[row.variant_type as VariantType] ?? row.variant_type}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.method}
                    onChange={(e) => updateRow(i, "method", e.target.value)}
                    className="rounded border bg-background px-2 py-1 text-sm"
                  >
                    <option value="flat">Flat Rate</option>
                    <option value="realtime">Real-time</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.base_price}
                    onChange={(e) => updateRow(i, "base_price", e.target.value)}
                    disabled={row.method === "realtime"}
                    className="w-24 rounded border bg-background px-2 py-1 text-sm disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.additional_price}
                    onChange={(e) => updateRow(i, "additional_price", e.target.value)}
                    disabled={row.method === "realtime"}
                    className="w-24 rounded border bg-background px-2 py-1 text-sm disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save All"}
      </Button>
    </div>
  );
}
