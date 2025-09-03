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
  order_number: string;
  user_id: string;
  waiter: { id: string; name: string; email: string } | null;
  waiter_status: number;
  rider: { id: string; name: string; email: string } | null;
  rider_status: number;
  order_date: string;
  created_by: string;
  total_amount: number;
  status: string;
  delivery_address?: string;
  order_type: string;
  payment_method: string;
  table_id: string | null;
  table_number?: string;
  combined_total_amount?: number;
  payment_status: string;
  received_amount?: number;
  customer_name: string;
  location?: string;
  notification: string;
  rider_note?: string;
  notification_status: number;
  parent_order_id: string | null;
  service_type: 'dine_in' | 'take_away';
  waiter_id?: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    _id: string;
    order_id: string;
    product_id: {
      _id: string;
      name: string;
      price: number;
      pictureUrl: string;
    };
    quantity: number;
    sub_total: number;
    created_by: string;
    createdAt: string;
    updatedAt: string;
  }>;
  estimated_completion?: string;
  linked_orders?: string[]; // Add this line
}