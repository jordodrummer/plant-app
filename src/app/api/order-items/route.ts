import { NextResponse } from "next/server";
import { getOrderItems, createOrderItem, deleteOrderItem } from "@/lib/db/order-items";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function isAdmin(email: string | undefined) {
  return email === process.env.ADMIN_EMAIL;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const user = await requireAuth();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
