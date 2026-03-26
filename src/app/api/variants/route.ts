import { NextResponse } from "next/server";
import { createVariant } from "@/lib/db/variants";
import { createServerSupabase } from "@/lib/supabase/server";
import type { VariantType } from "@/lib/types";

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { plant_id, variant_type, price, inventory, label, note, sort_order } = body;

    if (!plant_id || !variant_type || price == null) {
      return NextResponse.json({ error: "plant_id, variant_type, and price are required" }, { status: 400 });
    }

    const variant = await createVariant({
      plant_id,
      variant_type: variant_type as VariantType,
      price,
      inventory: inventory ?? 0,
      label: label ?? null,
      note: note ?? null,
      sort_order: sort_order ?? 0,
    });
    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
