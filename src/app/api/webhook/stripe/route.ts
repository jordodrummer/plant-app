import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { getOrderByPaymentIntent, updateOrderStatus } from "@/lib/db/orders";
import { confirmReservation, releaseReservation } from "@/lib/db/reservations";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await getOrderByPaymentIntent(paymentIntent.id);

      if (!order) {
        console.error("No order found for PaymentIntent:", paymentIntent.id);
        break;
      }

      if (order.status !== "pending_payment") {
        // Already processed (idempotent)
        break;
      }

      // Confirm the sale: decrement inventory and reserved
      await confirmReservation(order.id);
      await updateOrderStatus(order.id, "confirmed");
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await getOrderByPaymentIntent(paymentIntent.id);

      if (!order || order.status !== "pending_payment") break;

      // Release reservation and expire the order
      await releaseReservation(order.id);
      await updateOrderStatus(order.id, "expired");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
