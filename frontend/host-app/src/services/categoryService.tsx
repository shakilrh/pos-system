import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  description?: string;
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data: { data: T } | T;
  error?: string | null;
  details?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse<any>, logout: () => void): string => {
  if (!response.success) {
    switch (response.error) {
      case 'DATA_NOT_FOUND': return response.message || 'Category not found';
      case 'BAD_REQUEST': return response.message || 'Invalid input provided';
      case 'ALREADY_EXISTS': return response.message || 'Category name already exists';
      case 'CONFLICT': return response.message || 'Please try again';
      case 'FORBIDDEN': return response.message || 'Access denied';
      case 'UNAUTHORIZED':
        logout();
        window.location.href = '/pos-system/login';
        return 'Please log in to continue';
      case 'MONGO_EXCEPTION': return response.message || 'Invalid category ID';
      case 'DB_ERROR': return response.message || 'Database error occurred';
      case 'PRODUCTS_ASSOCIATED': return response.message || 'Cannot delete category with associated products';
      default: return response.message || 'An unexpected error occurred';
    }
  }
  return '';
};

export const fetchCategories = async (token: string, logout: () => void): Promise<Category[]> => {
  try {
    const url = `${API_BASE_URL}/categories/api/v1/list`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<Category[]> = await response.json();

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1 || !data.data) {
      throw new Error('Invalid response format');
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
    throw new Error(message);
  }
};

export const addCategory = async (
  token: string,
  logout: () => void,
  name: string,
  description?: string
): Promise<Category> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/api/v1/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<Category> = await response.json();

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1 || !data.data) {
      throw new Error('Invalid response format');
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add category';
    throw new Error(message);
  }
};

export const updateCategory = async (
  token: string,
  logout: () => void,
  id: string,
  name: string,
  description?: string
): Promise<Category> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/api/v1/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, name, description }),
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<Category> = await response.json();

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1 || !data.data) {
      throw new Error('Invalid response format');
    }

    return 'data' in data.data ? data.data.data : data.data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update category';
    throw new Error(message);
  }
};

export const deleteCategory = async (token: string, logout: () => void, id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/api/v1/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<void> = await response.json();

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1) {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete category';
    throw new Error(message);
  }
};
