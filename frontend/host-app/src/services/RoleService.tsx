interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions?: { _id: string; key: string }[];
  created_by?: string;
  __v?: number;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: { data?: Role[] } | Role;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse, logout: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);
    switch (response.error) {
      case 'DATA_NOT_FOUND':
        return 'Role not found';
      case 'BAD_REQUEST':
        return response.message || 'Invalid input provided. Please check your data and try again';
      case 'ALREADY_EXISTS':
        return response.message || 'A role with this name already exists';
      case 'CONFLICT':
        return response.message || 'Conflict occurred. Please refresh and try again';
      case 'FORBIDDEN':
        return 'You do not have permission to perform this action';
      case 'UNAUTHORIZED':
        logout();
        return 'Your session has expired. Please log in again';
      case 'MONGO_EXCEPTION':
        return 'Database error occurred. Please try again later';
      case 'DB_CHECK_FAIL':
        return response.message || 'Database validation failed';
      case 'VALIDATION_ERROR':
        return response.message || 'Please check your input and try again';
      case 'DUPLICATE_KEY':
        return 'A role with this name already exists';
      case 'INVALID_ID':
        return 'Invalid role identifier provided';
      default:
        return response.message || 'An unexpected error occurred. Please try again';
    }
  }
  return '';
};

// Helper function to validate network response
const validateResponse = async (response: Response): Promise<ApiResponse> => {
  if (!response.ok) {
    // Handle different HTTP status codes
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

export const fetchRoles = async (token: string, logout: () => void): Promise<Role[]> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data && 'data' in data.data) {
      const roles = (data.data as { data: Role[] }).data || [];
      // Ensure all roles have permissions array
      return roles.map(role => ({
        ...role,
        permissions: role.permissions || []
      }));
    }

    throw new Error('Invalid response format from server');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to fetch roles. Please check your connection and try again');
  }
};

export const createRole = async (
  token: string,
  logout: () => void,
  name: string,
  description?: string
): Promise<Role> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    if (!name || !name.trim()) {
      throw new Error('Role name is required');
    }

    const trimmedName = name.trim();
    const trimmedDescription = description?.trim();

    // Client-side validation
    if (trimmedName.length < 2) {
      throw new Error('Role name must be at least 2 characters long');
    }

    if (trimmedName.length > 50) {
      throw new Error('Role name must not exceed 50 characters');
    }

    if (trimmedDescription && trimmedDescription.length > 200) {
      throw new Error('Description must not exceed 200 characters');
    }

    const requestBody: { name: string; description?: string } = {
      name: trimmedName
    };

    if (trimmedDescription) {
      requestBody.description = trimmedDescription;
    }

    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data) {
      const role = data.data as Role;
      // Ensure permissions array exists
      return {
        ...role,
        permissions: role.permissions || []
      };
    }

    throw new Error('Invalid response format from server');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to create role. Please try again');
  }
};

export const updateRole = async (
  token: string,
  logout: () => void,
  role_id: string,
  name: string,
  description?: string
): Promise<Role> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    if (!role_id || !role_id.trim()) {
      throw new Error('Role ID is required');
    }

    if (!name || !name.trim()) {
      throw new Error('Role name is required');
    }

    const trimmedName = name.trim();
    const trimmedDescription = description?.trim();

    // Client-side validation
    if (trimmedName.length < 2) {
      throw new Error('Role name must be at least 2 characters long');
    }

    if (trimmedName.length > 50) {
      throw new Error('Role name must not exceed 50 characters');
    }

    if (trimmedDescription && trimmedDescription.length > 200) {
      throw new Error('Description must not exceed 200 characters');
    }

    const requestBody: { role_id: string; name: string; description?: string } = {
      role_id: role_id.trim(),
      name: trimmedName
    };

    if (trimmedDescription) {
      requestBody.description = trimmedDescription;
    }

    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (data.success && data.type === 1 && data.data) {
      const role = data.data as Role;
      // Ensure permissions array exists
      return {
        ...role,
        permissions: role.permissions || []
      };
    }

    throw new Error('Invalid response format from server');
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to update role. Please try again');
  }
};

export const deleteRole = async (
  token: string,
  logout: () => void,
  role_id: string
): Promise<void> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }

    if (!role_id || !role_id.trim()) {
      throw new Error('Role ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ role_id: role_id.trim() }),
    });

    if (response.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again');
    }

    const data = await validateResponse(response);

    if (!data.success) {
      throw new Error(handleApiError(data, logout));
    }

    if (!data.success || data.type !== 1) {
      throw new Error('Failed to delete role');
    }
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to delete role. Please try again');
  }
};

// Additional utility functions for role management

export const validateRoleName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return 'Role name is required';
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return 'Role name must be at least 2 characters long';
  }

  if (trimmedName.length > 50) {
    return 'Role name must not exceed 50 characters';
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
    return 'Role name can only contain letters, numbers, spaces, hyphens, and underscores';
  }

  return null;
};

export const validateRoleDescription = (description: string): string | null => {
  if (!description) {
    return null; // Description is optional
  }

  const trimmedDescription = description.trim();

  if (trimmedDescription.length > 0 && trimmedDescription.length < 5) {
    return 'Description must be at least 5 characters long if provided';
  }

  if (trimmedDescription.length > 200) {
    return 'Description must not exceed 200 characters';
  }

  return null;
};

export const checkDuplicateRoleName = (
  name: string,
  roles: Role[],
  excludeId?: string
): boolean => {
  const trimmedName = name.trim().toLowerCase();
  return roles.some(role =>
    role.name.toLowerCase() === trimmedName &&
    (!excludeId || role._id !== excludeId)
  );
};
