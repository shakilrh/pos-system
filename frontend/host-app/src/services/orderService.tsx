import toast from 'react-hot-toast';

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface OrderData {
  order_type: string;
  customer_name: string;
  service_type: 'dine_in' | 'take_away';
  table_number?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  displayPrice: string;
}

interface OrderItemResponse {
  product_id: string;
  product: Product;
  quantity: number;
  sub_total: number;
}

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
  order_number: string;
  createdAt: string;
  updatedAt: string;
  service_type: 'dine_in' | 'take_away';
  items: OrderItemResponse[];
  customer_name: string;
  table_number?: string;
  __v: number;
  notification?: 'pending' | 'confirmed' | 'ready' | 'served' | 'completed' | 'cancel';
  notification_status?: 0 | 1;
}

interface QueueOrderItem {
  product: {
    _id: string;
    name: string;
  };
  quantity: number;
}

interface QueueOrder {
  order_number: string;
  time_left: number;
  estimated_time: string;
  order_id: string;
  order_type: string;
  status: string;
  customer_name: string;
  service_type: 'dine_in' | 'take_away';
  notification: string;
  notification_status: number;
  items: QueueOrderItem[];
  table_number?: string;
}

interface QueueApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data: {
    data: QueueOrder[];
  };
}

interface PhysicalQueueOrder {
  _id: string;
  order_number: string;
  status: string;
  customer_name: string;
  position: number;
  table_number?: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data: { data: T } | T;
  error?: string;
}

const handleApiError = (response: ApiResponse<any>, logout: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.statusCode) {
      case 400: return response.message || 'Invalid input provided';
      case 401:
        logout();
        window.location.href = '/pos-system/login';
        return 'Please log in to continue';
      case 403: return 'Access denied';
      case 404: return response.message || 'Resource not found';
      case 409: return response.message || 'Duplicate entry';
      case 500: return 'An unexpected server error occurred';
      default: return 'An unexpected error occurred';
    }
  }
  return '';
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.18.107:3000';

export const createOrder = async (
  token: string,
  logout: () => void,
  items: OrderItem[],
  orderData: OrderData
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items, ...orderData }),
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create order';
    toast.error(message);
    throw new Error(message);
  }
};

export const updateOrder = async (
  token: string,
  logout: () => void,
  order_id: string,
  updateData: {
    items?: OrderItem[];
    customer_name?: string;
    service_type?: 'dine_in' | 'take_away';
    table_number?: string;
  }
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id, ...updateData }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update order');
  }
};

export const assignTable = async (
  token: string,
  logout: () => void,
  order_number: string,
  table_id: string // Changed from table_number to table_id
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/assign-table`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number, table_id }), // Send table_id
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assign table';
    toast.error(message);
    throw new Error(message);
  }
};
export const confirmOrder = async (
  token: string,
  logout: () => void,
  order_id: string,
  preparation_time: number
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id, preparation_time }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to confirm order');
  }
};

export const markOrderAsReady = async (
  token: string,
  logout: () => void,
  order_number: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/ready`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as ready');
  }
};

export const markOrderAsServed = async (
  token: string,
  logout: () => void,
  order_number: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/served`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as served');
  }
};

export const markOrderAsCompleted = async (
  token: string,
  logout: () => void,
  order_number: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/completed`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  }  catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as completed');
  }
};

export const cancelOrder = async (
  token: string,
  logout: () => void,
  order_id: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to cancel order');
  }
};

export const getAllOrders = async (token: string, logout: string | (() => void)): Promise<Order[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Order[]> = await response.json();
    if (!data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data || [];
  } catch (err) {
    console.error('Error in getAllOrders:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch orders');
  }
};

export const getOrderQueue = async (token: string, logout: () => void): Promise<QueueOrder[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: QueueApiResponse = await response.json();
    if (!data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return data.data?.data ?? [];
  } catch (err) {
    console.error('Error in getOrderQueue:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch order queue');
  }
};

export const processPayment = async (
  token: string,
  logout: string | (() => void),
  order_id: string,
  received_amount: number,
  payment_method: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id, received_amount, payment_method }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to process payment');
  }
};

export const markNotificationAsRead = async (
  token: string,
  logout: () => void,
  order_number: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/notification`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark notification as read');
  }
};

export const getPhysicalQueue = async (token: string, logout: () => void): Promise<PhysicalQueueOrder[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/physical-queue`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data: ApiResponse<PhysicalQueueOrder[]> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data || [];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch physical queue');
  }
};

export type { QueueOrder, Order, OrderItemResponse };
