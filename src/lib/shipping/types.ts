export type RateRequest = {
  origin_zip: string;
  destination_zip: string;
  weight_oz: number;
};

export type ShippingRate = {
  carrier: string;
  service: string;
  rate: number;
  estimated_days: number;
};

export interface ShippingProvider {
  getRates(request: RateRequest): Promise<ShippingRate[]>;
}
