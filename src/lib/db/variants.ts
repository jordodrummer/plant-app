import { getSupabase } from "../supabase/server";
import type { PlantVariant } from "../types";

export async function getVariantsByPlantId(plantId: number): Promise<PlantVariant[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_variants")
    .select("*")
    .eq("plant_id", plantId)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function createVariant(variant: Omit<PlantVariant, "id">): Promise<PlantVariant> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_variants")
    .insert(variant)
    .select()
    .single();

  if (error) throw error;

  // Update parent plant in_stock
  const { data: variants } = await supabase
    .from("plant_variants")
    .select("inventory")
    .eq("plant_id", variant.plant_id)
    .gt("inventory", 0)
    .limit(1);

  await supabase
    .from("plants")
    .update({ in_stock: (variants?.length ?? 0) > 0 })
    .eq("id", variant.plant_id);

  return data;
}

export async function updateVariantInventory(id: number, inventory: number): Promise<PlantVariant | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_variants")
    .update({ inventory })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) return null;

  // Update parent plant in_stock
  const { data: variants } = await supabase
    .from("plant_variants")
    .select("inventory")
    .eq("plant_id", data.plant_id)
    .gt("inventory", 0)
    .limit(1);

  await supabase
    .from("plants")
    .update({ in_stock: (variants?.length ?? 0) > 0 })
    .eq("id", data.plant_id);

  return data;
}

export async function updateVariant(
  id: number,
  fields: Partial<Omit<PlantVariant, "id" | "plant_id">>
): Promise<PlantVariant | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_variants")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;

  // Update parent plant in_stock
  const { data: variants } = await supabase
    .from("plant_variants")
    .select("inventory")
    .eq("plant_id", data.plant_id)
    .gt("inventory", 0)
    .limit(1);

  await supabase
    .from("plants")
    .update({ in_stock: (variants?.length ?? 0) > 0 })
    .eq("id", data.plant_id);

  return data;
}

export async function deleteVariant(id: number): Promise<boolean> {
  const supabase = getSupabase();

  // Get plant_id before deleting
  const { data: variant } = await supabase
    .from("plant_variants")
    .select("plant_id")
    .eq("id", id)
    .single();

  const { error, count } = await supabase
    .from("plant_variants")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;

  // Update parent plant in_stock
  if (variant) {
    const { data: remaining } = await supabase
      .from("plant_variants")
      .select("inventory")
      .eq("plant_id", variant.plant_id)
      .gt("inventory", 0)
      .limit(1);

    await supabase
      .from("plants")
      .update({ in_stock: (remaining?.length ?? 0) > 0 })
      .eq("id", variant.plant_id);
  }

  return (count ?? 0) > 0;
}
