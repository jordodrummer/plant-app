import { getServiceSupabase } from "../supabase/server";
import type { Category } from "../types";

export async function getCategories(): Promise<Category[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createCategory(name: string): Promise<Category> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data;
}
