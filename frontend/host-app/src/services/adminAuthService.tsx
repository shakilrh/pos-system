
import toast from 'react-hot-toast';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: { data: T };
  error?: string | null;
  details?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);

    if (response.message) {
      if (response.error === 'UNAUTHORIZED' && logout) {
        logout();
        window.location.href = '/login';
      }
      return response.message;
    }

    switch (response.error) {
      case 'BAD_REQUEST':
        return 'Invalid input provided';
      case 'ALREADY_EXISTS':
        return 'Admin with this email already exists';
      case 'UNAUTHORIZED':
        if (logout) {
          logout();
          window.location.href = '/login';
        }
        return 'Invalid email or password';
      case 'DATA_NOT_FOUND':
        return 'Resource not found';
      case 'CONFLICT':
        return 'Resource already exists or conflict occurred';
      case 'FORBIDDEN':
        return 'Access denied';
      case 'MONGO_EXCEPTION':
        console.error('MongoDB Error Details:', response.details);
        return 'Database error occurred';
      case 'DB_ERROR':
        return 'Database error occurred';
      case 'INTERNAL_SERVER_ERROR':
      default:
        return 'An unexpected error occurred';
    }
  }
  return '';
};

export const adminAuthService = {
  registerAdmin: async (
      name: string,
      email: string,
      password: string,
      logo: File | null,
      storeName: string,
      phoneNumber: string | null,
      address: string | null,
      slug: string | null,
      logout?: () => void
  ): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('slug', slug);
      if (logo) {
        formData.append('logo', logo);
      }
      formData.append('store_name', storeName);
      if (phoneNumber) {
        formData.append('phone_number', phoneNumber);
      }
      if (address) {
        formData.append('address', address);
      }

      const response = await fetch(`${API_BASE_URL}/users/api/v1/create-admin`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      let data: ApiResponse;

      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
      }

      if (!response.ok) {
        if (data && typeof data === 'object') {
          const errorMessage = handleApiError(data, logout);
          throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (data && !data.success) {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage);
      }

      if (data && data.type !== undefined && data.type !== 1) {
        throw new Error('Invalid response format from server');
      }

      return data?.data?.data || data;
    } catch (error) {
      console.error('Registration error details:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to register admin. Please try again.');
    }
  },

  loginAdmin: async (
      email: string,
      password: string,
      logout?: () => void
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);

      let data: ApiResponse;

      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
      }

      if (!response.ok) {
        if (data && typeof data === 'object') {
          const errorMessage = handleApiError(data, logout);
          throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (data && !data.success) {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage);
      }

      if (data && data.type !== undefined && data.type !== 1) {
        throw new Error('Invalid response format from server');
      }

      return data?.data?.data || data;
    } catch (error) {
      console.error('Login error details:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to login. Please try again.');
    }
  },

  forgotPassword: async (email: string): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/api/v1/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      console.log('Response status:', response.status);

      let data: ApiResponse;

      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
      }

      if (!response.ok) {
        if (data && typeof data === 'object') {
          const errorMessage = handleApiError(data);
          throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (data && !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage);
      }

      if (data && data.type !== undefined && data.type !== 1) {
        throw new Error('Invalid response format from server');
      }

      return data?.data?.data || data;
    } catch (error) {
      console.error('Forgot password error details:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send reset code. Please try again.');
    }
  },

  resetPassword: async (
      email: string,
      resetCode: string,
      newPassword: string
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/api/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          resetCode,
          newPassword,
        }),
      });

      console.log('Response status:', response.status);

      let data: ApiResponse;

      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
      }

      if (!response.ok) {
        if (data && typeof data === 'object') {
          const errorMessage = handleApiError(data);
          throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      if (data && !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage);
      }

      if (data && data.type !== undefined && data.type !== 1) {
        throw new Error('Invalid response format from server');
      }

      return data?.data?.data || data;
    } catch (error) {
      console.error('Reset password error details:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reset password. Please try again.');
    }
  },
};




