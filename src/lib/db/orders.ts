import { getSupabase } from "../supabase/server";
import type { Order } from "../types";

export async function getOrders(): Promise<Order[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*");

  if (error) throw error;
  return data ?? [];
}

export async function getOrderById(id: number): Promise<Order | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function createOrder(customerId: number): Promise<Order> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .insert({ customer_id: customerId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: number, status: string): Promise<Order | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_on: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function deleteOrder(id: number): Promise<boolean> {
  const supabase = getSupabase();
  const { error, count } = await supabase
    .from("orders")
    .update({ status: "deleted", updated_on: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}
