"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "./checkout-form";
import { useCart } from "@/lib/cart-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type CheckoutState = {
  client_secret: string;
  order_id: number;
  items_total: number;
  shipping_cost: number;
  total: number;
  shipping_breakdown: { description: string; amount: number }[];
};

export default function CheckoutPage() {
  const { items } = useCart();
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);

  if (items.length === 0 && !checkoutState) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button render={<Link href="/products" />} variant="outline">
          Browse Products
        </Button>
      </div>
    );
  }

  if (checkoutState) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Payment</h1>
        <Elements stripe={stripePromise} options={{ clientSecret: checkoutState.client_secret }}>
          <CheckoutForm checkoutState={checkoutState} />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <AddressForm items={items} onCheckoutReady={setCheckoutState} />
    </div>
  );
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function AddressForm({
  items,
  onCheckoutReady,
}: {
  items: { plant_id: number; variant_id: number; quantity: number }[];
  onCheckoutReady: (state: CheckoutState) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            plant_id: i.plant_id,
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
          guest_name: name,
          guest_email: email,
          shipping_address: { street, city, state, zip },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }

      const data: CheckoutState = await res.json();
      onCheckoutReady(data);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded border bg-background px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Street Address</label>
        <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input type="text" required maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} className={inputClass} placeholder="CA" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP</label>
          <input type="text" required inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} className={inputClass} />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Processing..." : "Continue to Payment"}
      </Button>
    </form>
  );
}
