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
  table_id?: string;
  parent_order_number?: string;
  waiter_id?: string;
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
  waiter_id?: string | null;
  table_number?: string; // Add this if it's used
  payment_status: string;
  received_amount?: number;
  customer_name: string;
  notification: string;
  rider_note?: string;
  delivery_address?: string;
  notification_status: number;
  parent_order_id: string | null;
  service_type: 'dine_in' | 'take_away'; // Add this line
  waiter_id?: string; // Add this if it's used
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
}


interface Worker {
  id: string;
  name: string;
  role: string;
  is_assigned: boolean;
}

interface Waiter {
  _id: string;
  name: string;
  email: string;
  user_type: 'waiter';
  role: string | null;
  created_by: {
    id: string;
    name: string;
    email: string;
    store_name: string;
    logoUrl: string;
    store_logo: string;
  };
}

interface Rider {
  _id: string;
  name: string;
  email: string;
  user_type: 'rider';
  role: string | null;
  created_by: {
    id: string;
    name: string;
    email: string;
    store_name: string;
    logoUrl: string;
    store_logo: string;
  };
}
interface AssignWorkerRequest {
  order_number: string;
  waiter_id?: string;
}

interface AddToOrderRequest {
  order_number: string;
  items: OrderItem[];
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
      case 404: return response.message || 'Order not found';
      case 409: return response.message || 'Duplicate entry';
      case 500: return 'An unexpected server error occurred';
      default: return 'An unexpected error occurred';
    }
  }
  return '';
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.18.37:3000';

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
  table_id: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/assign-table`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number, table_id }),
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


export const markOrderOutForDelivery = async (
    token: string,
    logout: () => void,
    order_number: string,
    rider_id: string
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/out-for-delivery`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number, rider_id }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as out for delivery');
  }
};

export const fetchFreeRiders = async (token: string, logout: () => void): Promise<Rider[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/all-riders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: ApiResponse<{ data: any[] }> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }
    const riders = data.data?.data || [];
    return riders.map(rider => ({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      user_type: rider.user_type,
      role: rider.role,
      created_by: {
        id: rider.created_by.id,
        name: rider.created_by.name,
        email: rider.created_by.email,
        store_name: rider.created_by.store_name,
        logoUrl: rider.created_by.logoUrl,
        store_logo: rider.created_by.store_logo,
      },
    }));
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch riders');
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
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as completed');
  }
};

export const confirmOrder = async (
    token: string,
    logout: () => void,
    order_number: string, // Change parameter name
    preparation_time: number
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number, preparation_time }), // Use order_number
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

export const cancelOrder = async (
    token: string,
    logout: () => void,
    order_number: string // Change parameter name
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }), // Use order_number
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

export const getOrderByNumber = async (
  token: string,
  logout: () => void,
  order_number: string
): Promise<Order> => {
  try {
    console.log(`Fetching order with number: ${order_number}`);
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/by-number`, {
      method: 'POST', // Changed to POST to match Postman request
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}, order_number: ${order_number}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Order> = await response.json();
    console.log('API response:', data);
    if (!data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch order by number';
    console.error('Error in getOrderByNumber:', message);
    toast.error(message);
    throw new Error(message);
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

export const fetchFreeWaiters = async (token: string, logout: () => void): Promise<Waiter[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/all-waiters`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: ApiResponse<{ data: any[] }> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }
    const waiters = data.data?.data || [];
    return waiters.map(waiter => ({
      _id: waiter._id, // Map 'id' to '_id' to match Waiter interface
      name: waiter.name,
      email: waiter.email,
      user_type: waiter.user_type,
      role: waiter.role,
      created_by: {
        id: waiter.created_by.id,
        name: waiter.created_by.name,
        email: waiter.created_by.email,
        store_name: waiter.created_by.store_name,
        logoUrl: waiter.created_by.logoUrl,
        store_logo: waiter.created_by.store_logo,
      },
    }));
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch waiters');
  }
};


export const addToExistingOrder = async (
  token: string,
  logout: () => void,
  order_number: string,
  items: OrderItem[]
): Promise<Order> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/api/v1/add-to-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number, items }),
    });

    const data: ApiResponse<Order> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || handleApiError(data, logout));
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to add items to order');
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
