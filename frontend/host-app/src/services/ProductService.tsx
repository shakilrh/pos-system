import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  displayPrice: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data: { data: T };
  error?: string;
  details?: any;
}

const handleApiError = (response: ApiResponse<any>, logout: () => void): string => {
  if (!response.success) {
    switch (response.error) {
      case 'DATA_NOT_FOUND': return 'Not Found';
      case 'BAD_REQUEST': return response.message || 'Invalid input provided';
      case 'ALREADY_EXISTS': return response.message || 'Product name already exists';
      case 'CONFLICT': return response.message || 'Please try again';
      case 'FORBIDDEN': return 'Access Denied';
      case 'UNAUTHORIZED':
        logout();
        window.location.href = '/pos-system/login';
        return 'Please log in to continue';
      case 'MONGO_EXCEPTION': return 'Database error occurred';
      case 'DB_ERROR': return response.message || 'Database error occurred';
      default: return 'An unexpected error occurred';
    }
  }
  return '';
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';

export const fetchProducts = async (
  token: string,
  logout: () => void,
  categories: Category[],
  categoryId?: string
): Promise<Product[]> => {
  try {
    const url = new URL(`${API_BASE_URL}/products/api/v1/list`);
    if (categoryId) url.searchParams.append('category_id', categoryId);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<Product[]> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1 || !data.data?.data) {
      throw new Error('Invalid response format');
    }

    return data.data.data.map((product: any) => {
      if (typeof product.price !== 'number') {
        throw new Error(`Invalid price for product ${product.name}`);
      }
      return {
        _id: product._id,
        name: product.name,
        price: product.price,
        category_id: product.category_id,
        categoryName: categories.find((cat) => cat._id === product.category_id)?.name || 'Unknown',
        description: product.description || '',
        pictureUrl: product.pictureUrl || null,
        created_by: product.created_by,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        displayPrice: `$${product.price.toFixed(2)}`,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    toast.error(message);
    throw error;
  }
};

export const addProduct = async (
  token: string,
  logout: () => void,
  categories: Category[],
  formData: FormData
): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/api/v1/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<Product> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1 || !data.data?.data) {
      throw new Error('Invalid response format');
    }

    const product = data.data.data;
    if (typeof product.price !== 'number') {
      throw new Error(`Invalid price for product ${product.name}`);
    }
    const category_id = formData.get('category_id') as string;
    return {
      _id: product._id,
      name: product.name,
      price: product.price,
      category_id: product.category_id,
      categoryName: categories.find((cat) => cat._id === category_id)?.name || 'Unknown',
      description: product.description || '',
      pictureUrl: product.pictureUrl || null,
      created_by: product.created_by,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      displayPrice: `$${product.price.toFixed(2)}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add product';
    toast.error(message);
    throw error;
  }
};

export const updateProduct = async (
  token: string,
  logout: () => void,
  categories: Category[],
  formData: FormData
): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/api/v1/update`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.status === 401) {
      logout();
      window.location.href = '/pos-system/login';
      throw new Error('Unauthorized');
    }

    const data: ApiResponse<Product> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1 || !data.data?.data) {
      throw new Error('Invalid response format');
    }

    const product = data.data.data;
    if (typeof product.price !== 'number') {
      throw new Error(`Invalid price for product ${product.name}`);
    }
    const category_id = formData.get('category_id') as string;
    return {
      _id: product._id,
      name: product.name,
      price: product.price,
      category_id: product.category_id,
      categoryName: categories.find((cat) => cat._id === category_id)?.name || 'Unknown',
      description: product.description || '',
      pictureUrl: product.pictureUrl || null,
      created_by: product.created_by,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      displayPrice: `$${product.price.toFixed(2)}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    toast.error(message);
    throw error;
  }
};

export const deleteProduct = async (token: string, logout: () => void, id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/api/v1/delete`, {
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

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.type !== 1) {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    toast.error(message);
    throw error;
  }
};
