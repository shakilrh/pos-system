interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: { data?: Role[] } | Role;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';

const handleApiError = (response: ApiResponse, logout: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.error) {
      case 'DATA_NOT_FOUND': return 'Not Found';
      case 'BAD_REQUEST': return response.message || 'Invalid input provided';
      case 'ALREADY_EXISTS': return response.message || 'Role already exists';
      case 'CONFLICT': return response.message || 'Please try again';
      case 'FORBIDDEN': return 'Access Denied';
      case 'UNAUTHORIZED':
        logout();
        return 'Please log in to continue';
      case 'MONGO_EXCEPTION': return 'Database error occurred';
      case 'DB_CHECK_FAIL': return response.message || 'Database error occurred';
      default: return 'An unexpected error occurred';
    }
  }
  return '';
};

export const fetchRoles = async (token: string, logout: () => void): Promise<Role[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/list`, {
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
      return (data.data as { data: Role[] }).data || [];
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch roles');
  }
};

export const createRole = async (token: string, logout: () => void, name: string): Promise<Role> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim() }),
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
      return data.data as Role;
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to create role');
  }
};

export const deleteRole = async (token: string, logout: () => void, role_id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role_id }),
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
    throw new Error(err instanceof Error ? err.message : 'Failed to delete role');
  }
};
