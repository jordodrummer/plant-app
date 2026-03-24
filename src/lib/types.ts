export type VariantType = 'cutting' | 'rooted_cutting' | 'cut_to_order' | 'mother_stand' | 'seedling' | 'op_seeds' | 'hybrid_seeds';
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

export type Order = {
  id: number;
  customer_id: number;
  created_on: Date;
  updated_on: Date;
  status: string;
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
