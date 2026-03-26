import { NextResponse } from "next/server";
import { getItems, createItem } from "@/lib/db/items";
import { createServerSupabase } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const plants = await getItems();
    return NextResponse.json(plants);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { cultivar_name, category_id, details, in_stock } = body;

    if (!cultivar_name || !category_id) {
      return NextResponse.json({ error: "cultivar_name and category_id are required" }, { status: 400 });
    }

    const plant = await createItem({
      cultivar_name,
      category_id,
      details: details ?? null,
      in_stock: in_stock ?? false,
    });
    return NextResponse.json(plant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
