import { getSupabase } from "../supabase/server";
import type { ShippingConfig } from "../types";

export async function getShippingConfig(): Promise<ShippingConfig[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("shipping_config")
    .select("*")
    .order("variant_type");

  if (error) throw error;
  return data ?? [];
}

export async function upsertShippingConfig(configs: Omit<ShippingConfig, "id">[]): Promise<void> {
  const supabase = getSupabase();

  for (const config of configs) {
    const { error } = await supabase
      .from("shipping_config")
      .upsert(
        {
          variant_type: config.variant_type,
          method: config.method,
          base_price: config.method === "flat" ? config.base_price : null,
          additional_price: config.method === "flat" ? config.additional_price : null,
        },
        { onConflict: "variant_type" }
      );

    if (error) throw error;
  }
}
