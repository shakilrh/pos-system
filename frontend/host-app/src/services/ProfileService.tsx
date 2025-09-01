interface User {
  _id: string;
  name: string;
  email: string;
  logoUrl?: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data: { data: { user: T } } | T;
  error?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

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

export const fetchProfile = async (token: string, logout: () => void): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/details`, {
      method: 'GET',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data: ApiResponse<User> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    const userData = 'data' in data.data && 'user' in data.data.data ? data.data.data.user : data.data;
    return {
      _id: userData._id,
      name: userData.name || '',
      email: userData.email || '',
      logoUrl: userData.logoUrl || '',
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch profile');
  }
};

export const updateProfile = async (
  token: string,
  logout: () => void,
  updateData: { name?: string; password?: string; logo?: File }
): Promise<User> => {
  try {
    const formData = new FormData();
    if (updateData.name) formData.append('name', updateData.name);
    if (updateData.password) formData.append('password', updateData.password);
    if (updateData.logo) formData.append('logo', updateData.logo);

    const response = await fetch(`${API_BASE_URL}/users/api/v1/admin-profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data: ApiResponse<User> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    const userData = 'data' in data.data && 'user' in data.data.data ? data.data.data.user : data.data;
    return {
      _id: userData._id,
      name: userData.name || '',
      email: userData.email || '',
      logoUrl: userData.logoUrl || '',
    };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update profile');
  }
};