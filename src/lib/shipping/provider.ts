import type { ShippingProvider } from "./types";
import { ShippoProvider } from "./shippo";

let provider: ShippingProvider | null = null;

export function getShippingProvider(): ShippingProvider {
  if (!provider) {
    provider = new ShippoProvider();
  }
  return provider;
}
