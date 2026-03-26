import { Shippo } from "shippo";
import type { ShippingProvider, RateRequest, ShippingRate } from "./types";

export class ShippoProvider implements ShippingProvider {
  private client: Shippo;

  constructor() {
    const apiKey = process.env.SHIPPO_API_KEY;
    if (!apiKey) throw new Error("SHIPPO_API_KEY is not set");
    this.client = new Shippo({ apiKeyHeader: apiKey });
  }

  async getRates(request: RateRequest): Promise<ShippingRate[]> {
    const shipment = await this.client.shipments.create({
      addressFrom: {
        zip: request.origin_zip,
        country: "US",
      },
      addressTo: {
        zip: request.destination_zip,
        country: "US",
      },
      parcels: [
        {
          length: "10",
          width: "8",
          height: "4",
          distanceUnit: "in",
          weight: String(request.weight_oz),
          massUnit: "oz",
        },
      ],
      async: false,
    });

    return (shipment.rates ?? [])
      .filter((r) => r.provider === "USPS")
      .map((r) => ({
        carrier: r.provider,
        service: r.servicelevel?.name ?? "Standard",
        rate: Math.round(parseFloat(r.amount) * 100),
        estimated_days: r.estimatedDays ?? 5,
      }))
      .sort((a, b) => a.rate - b.rate);
  }
}
