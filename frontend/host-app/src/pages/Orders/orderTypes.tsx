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
  user_id: string | null;
  order_date: string;
  created_by: string;
  total_amount: number;
  status: string;
  delivery_address: string | null;
  order_type: string;
  payment_method: string | null;
  payment_status: string;
  received_amount: number;
  order_number: string;
  createdAt: string;
  updatedAt: string;
  service_type: 'dine_in' | 'take_away';
  items: OrderItemResponse[];
  customer_name: string;
  table_number?: string; // Added table_number
  __v: number;
  notification?: 'pending' | 'confirmed' | 'ready' | 'picked' | 'payment_pending' | 'completed' | 'cancel';
  notification_status?: 0 | 1; // 0 = unread, 1 = read
}
