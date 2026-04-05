"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type CheckoutState = {
  order_id: number;
  items_total: number;
  shipping_cost: number;
  total: number;
  shipping_breakdown: { description: string; amount: number }[];
};

export default function CheckoutForm({ checkoutState }: { checkoutState: CheckoutState }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${checkoutState.order_id}`,
      },
    });

    // If we get here, there was an error (successful payments redirect)
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-2">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span>{formatPrice(checkoutState.items_total)}</span>
        </div>
        {checkoutState.shipping_breakdown.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.description}</span>
            <span>{item.amount > 0 ? formatPrice(item.amount) : "N/A"}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total</span>
          <span>{formatPrice(checkoutState.total)}</span>
        </div>
      </div>

      <PaymentElement />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Processing payment..." : `Pay ${formatPrice(checkoutState.total)}`}
      </Button>
    </form>
  );
}
