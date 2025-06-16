interface Order {
  _id: string;
  order_number: number;
  items: { product_id: string; quantity: number }[];
  order_type: string;
  status: string;
  createdAt: string;
  customerName?: string;
  location?: string;
  amount?: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: any;
}

const handleApiError = (response: ApiResponse, logout: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.statusCode) {
      case 400:
        return response.message || 'Invalid input provided';
      case 401:
        logout();
        return 'Please log in to continue';
      case 403:
        return 'Access denied';
      case 404:
        return response.message || 'Resource not found';
      case 409:
        return response.message || 'Duplicate entry';
      case 500:
        return 'An unexpected server error occurred';
      default:
        return 'An unexpected error occurred';
    }
  }
  return '';
};

export const getAllOrders = async (token: string, logout: () => void): Promise<Order[]> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
    return data.data || [];
  } catch (err) {
    console.error('Error in getAllOrders:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch orders');
  }
};

export const createOrder = async (
  token: string,
  logout: () => void,
  items: { product_id: string; quantity: number }[],
  order_type: string
): Promise<Order> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items, order_type }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
    return data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to create order');
  }
};

export const updateOrder = async (
  token: string,
  logout: () => void,
  order_id: string,
  items: { product_id: string; quantity: number }[]
): Promise<Order> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id, items }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
    return data.data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update order');
  }
};

export const confirmOrder = async (
  token: string,
  logout: () => void,
  order_id: string,
  preparation_time: number
): Promise<void> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id, preparation_time }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to confirm order');
  }
};

export const markOrderAsReady = async (token: string, logout: () => void, order_number: number): Promise<void> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as ready');
  }
};

export const markOrderAsPicked = async (token: string, logout: () => void, order_number: number): Promise<void> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/picked`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_number }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to mark order as picked');
  }
};

export const cancelOrder = async (token: string, logout: () => void, order_id: string): Promise<void> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/orders/api/v1/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ order_id }),
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to cancel order');
  }
};
