import { getSupabase } from "../supabase/server";
import type { PlantImage } from "../types";

export async function getImagesByPlantId(plantId: number): Promise<PlantImage[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_images")
    .select("*")
    .eq("plant_id", plantId)
    .order("sort_order");

  if (error) throw error;
  return data ?? [];
}

export async function createImage(image: Omit<PlantImage, "id">): Promise<PlantImage> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("plant_images")
    .insert(image)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteImage(id: number): Promise<boolean> {
  const supabase = getSupabase();
  const { error, count } = await supabase
    .from("plant_images")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function deleteImagesByPlantId(plantId: number): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("plant_images")
    .delete()
    .eq("plant_id", plantId);

  if (error) throw error;
}
