export interface Product {
  _id: string;
  name: string;
  price: number;
  pictureUrl?: string;
  description?: string;
}

// This interface was defined but not used by Order.
// It can be used as a base or for creating orders.
export interface OrderItem {
  product: Product;
  quantity: number;
  sub_total: number;
}

// CORRECTED: Define the response type for items from the API.
// This allows for more flexibility, such as not having the full product object.
export interface OrderItemResponse {
  product?: Product;
  product_name?: string; // A fallback if the full product object isn't available
  quantity: number;
  sub_total: number;
}

// IMPROVED: Use specific string union types for better type safety.
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'served' | 'cancelled' | 'completed';
export type OrderType = 'physical' | 'online_delivery';
export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';
export type NotificationType = "cancel" | "pending" | "confirmed" | "ready" | "served" | "completed" | "picked" | "payment_pending";

export interface Order {
  _id: string;
  user_id: string | null;
  order_date: string; // Consider using Date type if you parse it upon receipt
  created_by: string;
  total_amount: number;
  status: OrderStatus; // IMPROVED
  delivery_address: string | null;
  order_type: OrderType; // IMPROVED
  payment_method: PaymentMethod | null; // IMPROVED
  payment_status: PaymentStatus; // IMPROVED
  received_amount: number;
  order_number: string;
  createdAt: string; // Consider using Date type
  updatedAt: string; // Consider using Date type
  service_type: 'dine_in' | 'take_away';
  items: OrderItemResponse[]; // CORRECTED
  customer_name: string;
  table_number?: string;
  location?: string; // ADDED from previous error context
  __v: number;
  notification?: NotificationType;
  notification_status?: 0 | 1; // 0 = unread, 1 = read. (Consider boolean for clarity)
}