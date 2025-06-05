import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  price?: number;
  category_id: string;
  categoryName?: string;
  description: string;
  pictureUrl?: string | null;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  displayPrice?: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: { data?: Category[] | Product[] | Product } | Product;
  error?: string;
  details?: any;
}

const handleApiError = (response: ApiResponse, logout: () => void): string | null => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.error) {
      case 'DATA_NOT_FOUND':
        return 'Not Found';
      case 'BAD_REQUEST':
        return response.message || 'Invalid input provided';
      case 'ALREADY_EXISTS':
        return response.message || 'Product name already exists';
      case 'CONFLICT':
        return response.message || 'Please try again';
      case 'FORBIDDEN':
        return 'Access Denied';
      case 'UNAUTHORIZED':
        logout();
        return 'Please log in to continue';
      case 'MONGO_EXCEPTION':
        console.error('MongoDB Error Details:', response.details);
        return 'An error occurred';
      case 'DB_ERROR':
        return response.message || 'Database error occurred';
      case 'INTERNAL_SERVER_ERROR':
      default:
        return 'An unexpected error occurred';
    }
  }
  return null;
};

export const fetchProducts = async (
  token: string,
  logout: () => void,
  categories: Category[],
  categoryId?: string
): Promise<Product[]> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const url = categoryId
      ? `${apiUrl}/products/api/v1/by-category`
      : `${apiUrl}/products/api/v1/list`;
    const body = categoryId ? JSON.stringify({ category_id: categoryId }) : null;

    console.log('API URL:', apiUrl);
    console.log('Fetching products from:', url);
    console.log('Using token:', token);

    const response = await fetch(url, {
      method: categoryId ? 'POST' : 'GET',
      headers: {
        'Content-Type': body ? 'application/json' : undefined,
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    const data: ApiResponse = await response.json();

    const errorMessage = handleApiError(data, logout);
    if (!response.ok || !data.success) {
      throw new Error(errorMessage || 'Failed to fetch products');
    }

    if (data.success && data.type === 1 && data.data && 'data' in data.data) {
      return ((data.data as { data: Product[] }).data || []).map((product: Product) => ({
        ...product,
        price: product.price ?? 0,
        displayPrice: product.price != null ? `$${product.price.toFixed(2)}` : '$0.00',
        categoryName: categories.find((cat) => cat._id === product.category_id)?.name || 'Unknown',
        pictureUrl: product.pictureUrl || null,
      }));
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch products');
  }
};

export const addProduct = async (
  token: string,
  logout: () => void,
  categories: Category[],
  name: string,
  price: string,
  category_id: string,
  description: string,
  picture: File
): Promise<Product> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category_id', category_id);
    formData.append('description', description);
    formData.append('picture', picture);

    const response = await fetch(`${apiUrl}/products/api/v1/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    const errorMessage = handleApiError(data, logout);
    if (!response.ok || !data.success) {
      throw new Error(errorMessage || 'Failed to add product');
    }

    if (data.success && data.type === 1 && data.data) {
      const newProduct = 'data' in data.data ? (data.data as { data: Product }).data : data.data as Product;
      return {
        ...newProduct,
        price: newProduct.price ?? 0,
        displayPrice: newProduct.price != null ? `$${newProduct.price.toFixed(2)}` : '$0.00',
        categoryName: categories.find((cat) => cat._id === category_id)?.name || 'Unknown',
        pictureUrl: newProduct.pictureUrl || null,
      };
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to add product');
  }
};

export const updateProduct = async (
  token: string,
  logout: () => void,
  categories: Category[],
  id: string,
  name: string,
  price: string,
  category_id: string,
  description: string,
  picture?: File
): Promise<Product> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const formData = new FormData();
    formData.append('id', id);
    formData.append('name', name);
    formData.append('price', price);
    formData.append('category_id', category_id);
    formData.append('description', description);
    if (picture) {
      formData.append('picture', picture);
    }

    const response = await fetch(`${apiUrl}/products/api/v1/update`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    const errorMessage = handleApiError(data, logout);
    if (!response.ok || !data.success) {
      throw new Error(errorMessage || 'Failed to update product');
    }

    if (data.success && data.type === 1 && data.data) {
      const updatedProductData = 'data' in data.data ? (data.data as { data: Product }).data : data.data as Product;
      return {
        ...updatedProductData,
        price: updatedProductData.price ?? 0,
        displayPrice: updatedProductData.price != null ? `$${updatedProductData.price.toFixed(2)}` : '$0.00',
        categoryName: categories.find((cat) => cat._id === category_id)?.name || 'Unknown',
        pictureUrl: updatedProductData.pictureUrl || null,
      };
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update product');
  }
};

export const deleteProduct = async (token: string, logout: () => void, id: string): Promise<void> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/products/api/v1/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    const errorMessage = handleApiError(data, logout);
    if (!response.ok || !data.success) {
      throw new Error(errorMessage || 'Failed to delete product');
    }

    if (!data.success || data.type !== 1) {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to delete product');
  }
};
