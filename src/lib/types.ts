export type VariantType = 'cutting' | 'rooted_cutting' | 'cut_to_order' | 'mother_stand' | 'seedling' | 'op_seeds' | 'hybrid_seeds' | 'special';
export type ImageType = 'plant' | 'mother' | 'father' | 'cutting' | 'grown_example';

export type Category = {
  id: number;
  name: string;
};

export type Plant = {
  id: number;
  cultivar_name: string;
  category_id: number;
  details: string | null;
  in_stock: boolean;
};

export type PlantVariant = {
  id: number;
  plant_id: number;
  variant_type: VariantType;
  price: number;
  inventory: number;
  label: string | null;
  note: string | null;
  sort_order: number;
  weight_lbs: number;
  weight_oz: number;
  shipping_override: number | null;
};

export type PlantImage = {
  id: number;
  plant_id: number;
  url: string;
  image_type: ImageType;
  caption: string | null;
  sort_order: number;
};

export type PlantWithPricing = Plant & {
  min_price: number;
  variant_count: number;
  primary_image_url: string | null;
};

export type Customer = {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
};

export type OrderStatus = 'pending' | 'pending_payment' | 'confirmed' | 'shipped' | 'delivered' | 'deleted' | 'expired';

export type Order = {
  id: number;
  customer_id: number | null;
  created_on: Date;
  updated_on: Date;
  status: OrderStatus;
  stripe_payment_intent_id: string | null;
  shipping_cost: number | null;
  expires_at: Date | null;
  guest_email: string | null;
  guest_name: string | null;
  shipping_address_street: string | null;
  shipping_address_city: string | null;
  shipping_address_state: string | null;
  shipping_address_zip: string | null;
};

export type OrderDetail = {
  id: number;
  order_id: number;
  plant_id: number;
  variant_id: number | null;
  price_each: number;
  quantity: number;
};

export type CartItem = {
  plant_id: number;
  variant_id: number;
  cultivar_name: string;
  variant_type: string;
  variant_label: string;
  price: number;
  quantity: number;
  max_quantity: number;
};

export type CustomerWithStats = Customer & {
  order_count: number;
  total_spent: number;
};

export type ShippingConfig = {
  id: number;
  variant_type: VariantType;
  method: 'flat' | 'realtime';
  base_price: number | null;
  additional_price: number | null;
};
