"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUSES = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (status === currentStatus) return;
    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground">Status:</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border bg-background px-2 py-1 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={handleSave} disabled={saving || status === currentStatus}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
