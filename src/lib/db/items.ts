import { getSupabase } from "../supabase/server";
import type { Plant, PlantWithPricing } from "../types";

export async function getItems(): Promise<PlantWithPricing[]> {
  const supabase = getSupabase();
  const { data: plants, error } = await supabase
    .from("plants")
    .select(`
      *,
      plant_variants (id, price),
      plant_images (url, sort_order)
    `)
    .order("id");

  if (error) throw error;

  return (plants ?? []).map((p) => ({
    id: p.id,
    cultivar_name: p.cultivar_name,
    category_id: p.category_id,
    details: p.details,
    in_stock: p.in_stock,
    min_price: p.plant_variants?.length
      ? Math.min(...p.plant_variants.map((v: { price: number }) => v.price))
      : 0,
    variant_count: p.plant_variants?.length ?? 0,
    primary_image_url: p.plant_images
      ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
}

export async function getFeaturedItems(limit: number = 3): Promise<PlantWithPricing[]> {
  const supabase = getSupabase();
  const { data: plants, error } = await supabase
    .from("plants")
    .select(`
      *,
      plant_variants!inner (id, price, inventory),
      plant_images (url, sort_order)
    `)
    .eq("in_stock", true)
    .gt("plant_variants.inventory", 0)
    .limit(limit);

  if (error) throw error;

  return (plants ?? []).map((p) => ({
    id: p.id,
    cultivar_name: p.cultivar_name,
    category_id: p.category_id,
    details: p.details,
    in_stock: p.in_stock,
    min_price: p.plant_variants?.length
      ? Math.min(...p.plant_variants.map((v: { price: number }) => v.price))
      : 0,
    variant_count: p.plant_variants?.length ?? 0,
    primary_image_url: p.plant_images
      ?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }));
}

export async function getItemById(id: number): Promise<Plant | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createItem(item: Omit<Plant, "id">): Promise<Plant> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plants")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

const ALLOWED_COLUMNS = new Set(["cultivar_name", "category_id", "details", "in_stock"]);

export async function updateItem(id: number, fields: Partial<Omit<Plant, "id">>): Promise<Plant | null> {
  const filtered = Object.fromEntries(
    Object.entries(fields).filter(([k, v]) => v !== undefined && ALLOWED_COLUMNS.has(k))
  );
  if (Object.keys(filtered).length === 0) return getItemById(id);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plants")
    .update(filtered)
    .eq("id", id)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function deleteItem(id: number): Promise<boolean> {
  const supabase = getSupabase();
  const { error, count } = await supabase
    .from("plants")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
