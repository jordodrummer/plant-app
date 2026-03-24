import { NextResponse } from "next/server";
import { getOrderItems, createOrderItem, deleteOrderItem } from "@/lib/db/order-items";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const items = await getOrderItems(Number(orderId));
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, plant_id, variant_id, price_each, quantity } = body;

    if (!order_id || !plant_id || !variant_id || !price_each || !quantity) {
      return NextResponse.json(
        { error: "order_id, plant_id, variant_id, price_each, and quantity are required" },
        { status: 400 }
      );
    }

    const item = await createOrderItem(order_id, plant_id, variant_id, price_each, quantity);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const deleted = await deleteOrderItem(Number(id));
    if (!deleted) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
