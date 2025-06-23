export interface Product {
  _id: string;
  name: string;
  price: number;
  pictureUrl?: string;
  description?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  sub_total: number;
}

export interface Order {
  _id: string;
  order_number: number;
  items: OrderItem[];
  order_type: string;
  status: string;
  createdAt: string;
  customer_name?: string;
  location?: string;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  service_type?: string;
  [key: string]: any;
}
