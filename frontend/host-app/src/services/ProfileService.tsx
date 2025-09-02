interface UserProfile {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  logoUrl?: string;
  store_name?: string;
  store_logo?: string;
  phone_number?: string;
  address?: string;
  slug?: string;
  user_type?: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.error) {
      case 'DATA_NOT_FOUND':
        return 'Profile not found';
      case 'BAD_REQUEST':
        return response.message || 'Invalid input provided. Please check your data and try again';
      case 'ALREADY_EXISTS':
        return response.message || 'A profile with this data already exists';
      case 'CONFLICT':
        return response.message || 'Conflict occurred. Please refresh and try again';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action';
      case 'UNAUTHORIZED':
        logout?.();
        return 'Your session has expired. Please log in again';
      case 'MONGO_EXCEPTION':
        return 'Database error occurred. Please try again later';
      case 'DB_CHECK_FAIL':
        return response.message || 'Database validation failed';
      case 'VALIDATION_ERROR':
        return response.message || 'Please check your input and try again';
      case 'DUPLICATE_KEY':
        return 'A profile with this data already exists';
      case 'INVALID_ID':
        return 'Invalid profile identifier provided';
      default:
        return response.message || 'An unexpected error occurred. Please try again';
    }
  }
  return '';
};

const validateResponse = async (response: Response): Promise<ApiResponse> => {
  if (!response.ok) {
    switch (response.status) {
      case 400:
        throw new Error('Invalid request. Please check your input');
      case 401:
        throw new Error('Unauthorized');
      case 403:
        throw new Error('Access denied');
      case 404:
        throw new Error('Resource not found');
      case 409:
        throw new Error('Resource already exists');
      case 422:
        throw new Error('Validation failed');
      case 500:
        throw new Error('Server error. Please try again later');
      default:
        throw new Error(`Request failed with status ${response.status}`);
    }
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid response format from server');
  }

  return await response.json();
};

export const fetchUserProfile = async (token: string, logout?: () => void): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const response = await fetch(`${API_BASE_URL}/users/api/v1/details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (response.status === 401) {
      logout?.();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.data?.data?.user) {
      return data.data.data.user;
    }

    throw new Error('Invalid response format from server');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to fetch profile. Please check your connection and try again');
  }
};

export const updateProfileField = async (
    token: string,
    logout: () => void,
    field: string,
    value: string | File,
    userId?: string,
    isAdmin: boolean = false
): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const endpoint = isAdmin
        ? `${API_BASE_URL}/users/api/v1/admin-profile`
        : `${API_BASE_URL}/users/api/v1/profile`;

    const formData = new FormData();

    if (value instanceof File) {
      formData.append(field, value);
    } else {
      formData.append(field, value);
    }

    // Include user ID for worker users
    if (userId) {
      formData.append('_id', userId);
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    return data.data || {};
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to update profile. Please try again');
  }
};

export const updateProfileWithJson = async (
    token: string,
    logout: () => void,
    payload: Record<string, any>,
    isAdmin: boolean = false
): Promise<UserProfile> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const endpoint = isAdmin
        ? `${API_BASE_URL}/users/api/v1/admin-profile`
        : `${API_BASE_URL}/users/api/v1/profile`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    return data.data || {};
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to update profile. Please try again');
  }
};

// Validation functions
export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return 'Name is required';
  }
  if (name.length < 2) {
    return 'Name must be at least 2 characters';
  }
  return null;
};

export const validateStoreName = (storeName: string): string | null => {
  if (!storeName.trim()) {
    return 'Store name is required';
  }
  if (storeName.length < 3) {
    return 'Store name must be at least 3 characters';
  }
  return null;
};

export const validatePhoneNumber = (phoneNumber: string): string | null => {
  if (!phoneNumber.trim()) return null;
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,6}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return 'Please enter a valid phone number';
  }
  return null;
};

export const validateSlug = (slug: string): string | null => {
  if (!slug.trim()) {
    return 'Slug is required';
  }
  if (slug.length < 2) {
    return 'Slug must be at least 2 characters';
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Slug must contain only lowercase letters, numbers, or dashes';
  }
  return null;
};

export const validateAddress = (address: string): string | null => {
  if (!address.trim()) return null;
  if (address.length < 5) {
    return 'Store address must be at least 5 characters';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password.trim()) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 capital letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least 1 number';
  }
  return null;
};

export const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
  if (!confirmPassword.trim()) {
    return 'Please confirm your password';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }
  return null;
};

export const validateLogo = (file: File | null): string | null => {
  if (!file) return null;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Please select a valid image file (JPEG, PNG, GIF, WebP)';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Image size must be less than 5MB';
  }
  return null;
};