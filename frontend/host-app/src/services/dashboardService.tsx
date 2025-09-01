import { ApiResponse } from './orderService'; // Assuming ApiResponse is defined in orderService

interface Order {
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
  customer_name: string;
  service_type: 'dine_in' | 'take_away';
  notification: string;
  notification_status: number;
  createdAt: string;
  updatedAt: string;
  order_number: string;
  __v: number;
  items: {
    product: {
      _id: string;
      name: string;
      description: string;
      price: number;
      pictureUrl: string;
      category_id: string;
      created_by: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
      time_required: number;
    };
    quantity: number;
    sub_total: number;
  }[];
}

export const getOrders = async (token: string, logout: () => void): Promise<Order[]> => {
  try {
    const response = await fetch('http://192.168.18.37:3000/orders/api/v1/list', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Order[]> = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    return data.data.data || [];
  } catch (err) {
    console.error('Error in getOrders:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch orders');
  }
};
