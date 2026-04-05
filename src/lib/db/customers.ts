import { getServiceSupabase } from "../supabase/server";
import type { Customer, CustomerWithStats } from "../types";

export async function getCustomers(): Promise<CustomerWithStats[]> {
  const supabase = getServiceSupabase();
  const { data: customers, error } = await supabase
    .from("customers")
    .select(`
      *,
      orders (
        id,
        status,
        order_details (price_each, quantity)
      )
    `)
    .order("name");

  if (error) throw error;

  return (customers ?? []).map((c) => {
    const activeOrders = (c.orders ?? []).filter(
      (o: { status: string }) => o.status !== "deleted"
    );
    return {
      id: c.id,
      name: c.name,
      address: c.address,
      city: c.city,
      state: c.state,
      zip: c.zip,
      email: c.email,
      order_count: activeOrders.length,
      total_spent: activeOrders.reduce(
        (sum: number, o: { order_details: { price_each: number; quantity: number }[] }) =>
          sum + (o.order_details ?? []).reduce(
            (s: number, d: { price_each: number; quantity: number }) => s + d.price_each * d.quantity,
            0
          ),
        0
      ),
    };
  });
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}
