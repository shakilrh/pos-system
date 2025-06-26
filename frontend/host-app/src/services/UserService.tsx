interface User {
  _id: string;
  user_id?: string;
  name: string;
  email: string;
  password?: string;
  user_type: 'worker';
  role_id: string | null;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  logoUrl?: string;
  store_name?: string;
  store_logo?: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: { data?: { users?: User[] } | { user?: User } } | User | { role_id: string };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';

const handleApiError = (response: ApiResponse, logout: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.error) {
      case 'DATA_NOT_FOUND': return 'Not Found';
      case 'BAD_REQUEST': return response.message || 'Invalid input provided';
      case 'ALREADY_EXISTS': return response.message || 'User already exists';
      case 'CONFLICT': return response.message || 'Please try again';
      case 'FORBIDDEN': return 'Access Denied';
      case 'UNAUTHORIZED':
        logout();
        return 'Please log in to continue';
      case 'MONGO_EXCEPTION': return 'Database error occurred';
      case 'DB_ERROR': return response.message || 'Database error occurred';
      case 'INTERNAL_SERVER_ERROR':
      default: return 'An unexpected error occurred';
    }
  }
  return '';
};

export const fetchUsers = async (token: string, logout: () => void): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data && 'data' in data.data) {
      return (data.data as { data: User[] }).data.map((user) => ({
        ...user,
        _id: user._id || user.user_id || '',
        role_id: user.role_id?._id || user.role_id || null,
        logoUrl: user.logoUrl || '',
        store_name: user.store_name || '',
        store_logo: user.store_logo || '',
      })) || [];
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('Fetch users error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch users');
  }
};

export const fetchUserProfile = async (token: string, logout: () => void): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/details`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (
      data.success &&
      data.type === 1 &&
      data.data &&
      'data' in data.data &&
      'user' in (data.data as { data: { user?: User } }).data &&
      (data.data as { data: { user?: User } }).data.user
    ) {
      const user = (data.data as { data: { user: User } }).data.user;
      return {
        ...user,
        _id: user.id || user.user_id || '',
        role_id: user.role_id || null,
        logoUrl: user.logoUrl || '',
        name: user.name || 'User',
        store_name: user.store_name || '',
        store_logo: user.store_logo || '',
      };
    }
    throw new Error('Invalid response format: user data missing');
  } catch (err) {
    console.error('Fetch user profile error:', err, { token, response: err instanceof Error ? err.message : 'Unknown error' });
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch user profile');
  }
};

export const createUser = async (
  token: string,
  logout: () => void,
  userData: Partial<User>
): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data) {
      const newUser = data.data as User;
      return {
        ...newUser,
        _id: newUser._id || newUser.user_id || '',
        role_id: newUser.role_id || null,
        logoUrl: newUser.logoUrl || '',
        store_name: newUser.store_name || '',
        store_logo: newUser.store_logo || '',
      };
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('Create user error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to create user');
  }
};

export const updateUser = async (
  token: string,
  logout: () => void,
  userData: Partial<User>
): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data) {
      const updatedUser = data.data as User;
      return {
        ...updatedUser,
        _id: updatedUser._id || updatedUser.user_id || '',
        role_id: updatedUser.role_id || null,
        logoUrl: updatedUser.logoUrl || '',
        store_name: updatedUser.store_name || '',
        store_logo: updatedUser.store_logo || '',
      };
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('Update user error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to update user');
  }
};

export const deleteUser = async (token: string, logout: () => void, id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/delete`, {
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

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (!data.success || data.type !== 1) {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Delete user error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to delete user');
  }
};

export const assignRole = async (
  token: string,
  logout: () => void,
  user_id: string,
  role_id: string
): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/assign-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id, role_id }),
    });
    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok || !data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data) {
      const updatedUser = 'data' in data.data ? (data.data as { data: User }).data : data.data as User;
      return {
        ...updatedUser,
        _id: updatedUser._id || updatedUser.user_id || '',
        role_id: updatedUser.role_id || null,
        logoUrl: updatedUser.logoUrl || '',
        store_name: updatedUser.store_name || '',
        store_logo: updatedUser.store_logo || '',
      };
    }
    throw new Error('Invalid response format');
  } catch (err) {
    console.error('Assign role error:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to assign role');
  }
};