interface Category {
  _id: string;
  name: string;
  description: string;
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: { data?: Category[] | Category } | Category;
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

export const fetchCategories = async (token: string, logout: () => void): Promise<Category[]> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    console.log('API URL:', apiUrl);
    console.log('Fetching categories from:', `${apiUrl}/categories/api/v1/list`);
    console.log('Using token:', token);

    const response = await fetch(`${apiUrl}/categories/api/v1/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData: ApiResponse = await response.json();
          errorMessage = handleApiError(errorData, logout);
        } else {
          const text = await response.text();
          errorMessage += `, body: ${text.substring(0, 100)}`;
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    if (data.success && data.type === 1 && data.data && 'data' in data.data) {
      return (data.data as { data: Category[] }).data || [];
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('Error in fetchCategories:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch categories');
  }
};

export const addCategory = async (
  token: string,
  logout: () => void,
  name: string,
  description: string
): Promise<Category> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/categories/api/v1/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    const data: ApiResponse = await response.json();

    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    if (data.success && data.type === 1 && data.data) {
      return 'data' in data.data ? (data.data as { data: Category }).data : data.data as Category;
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to add category');
  }
};

export const updateCategory = async (
  token: string,
  logout: () => void,
  id: string,
  name: string,
  description: string
): Promise<Category> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/categories/api/v1/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, name, description }),
    });

    const data: ApiResponse = await response.json();

    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    if (data.success && data.type === 1 && data.data) {
      return 'data' in data.data ? (data.data as { data: Category }).data : data.data as Category;
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update category');
  }
};

export const deleteCategory = async (token: string, logout: () => void, id: string): Promise<void> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
    const response = await fetch(`${apiUrl}/categories/api/v1/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    const data: ApiResponse = await response.json();

    if (!data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    if (!data.success || data.type !== 1) {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to delete category');
  }
};
