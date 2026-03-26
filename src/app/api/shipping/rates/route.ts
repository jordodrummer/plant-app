import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/server";
import { getShippingConfig } from "@/lib/db/shipping";
import { calculateShipping } from "@/lib/shipping/calculator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination_zip, items } = body;

    if (!destination_zip || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "destination_zip and items are required" },
        { status: 400 }
      );
    }

    if (!/^\d{5}$/.test(destination_zip)) {
      return NextResponse.json({ error: "Invalid ZIP code" }, { status: 400 });
    }

    // Fetch variant details for all items
    const variantIds = items.map((i: { variant_id: number }) => i.variant_id);
    const supabase = getSupabase();
    const { data: variants, error } = await supabase
      .from("plant_variants")
      .select("id, variant_type, weight_lbs, weight_oz, shipping_override")
      .in("id", variantIds);

    if (error) throw error;

    const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));

    const cartVariants = items
      .map((item: { variant_id: number; quantity: number }) => {
        const v = variantMap.get(item.variant_id);
        if (!v) return null;
        return {
          variant_id: v.id,
          variant_type: v.variant_type,
          quantity: item.quantity,
          weight_lbs: v.weight_lbs ?? 0,
          weight_oz: v.weight_oz ?? 0,
          shipping_override: v.shipping_override,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const configs = await getShippingConfig();
    const result = await calculateShipping(cartVariants, configs, destination_zip);

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
