export type Category = {
  id: number;
  name: string;
  price: number;
};

export type Plant = {
  id: number;
  cultivar_name: string;
  category_id: number;
  image: string;
  inventory: number;
  price: number;
  details: string | null;
  in_stock: boolean;
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
  price_each: number;
  quantity: number;
};
