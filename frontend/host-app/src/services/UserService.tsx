// UserService.tsx
interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
  role_id?: string;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
  address?: string;
  created_by?: {
    id: string;
    name: string;
    email: string;
  };
  store_name?: string | null;
  logoUrl?: string | null;
  store_logo?: string | null;
  profile?: {
    job_title?: string;
    shift_time?: string;
    salary?: number;
    address?: string;
  };
}

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  user_type: string;
  role_id?: string;
  profile?: any;
  logoUrl?: string;
  store_name?: string;
  store_logo?: string;
}

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string | null;
  type: number;
  data?: { data?: { users?: User[] } | { user?: User } | User } | User | T;
  details?: any;
}

interface UserDetailsApiResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      user: UserDetails;
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  user_type: string;
  phone_number: string;
  store_name: string;
  address: string;
  logoUrl: string;
  store_logo: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';
const TIMEOUT = 10000; // 10 seconds

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
  if (!response.success) {
    console.error('API Error:', response);

    // Always prioritize the message from backend if available
    if (response.message) {
      // Handle logout for unauthorized errors
      if (response.error === 'UNAUTHORIZED' && logout) {
        logout();
        window.location.href = '/login';
      }
      return response.message;
    }

    // Fallback to error-specific messages if no message provided
    switch (response.error) {
      case 'BAD_REQUEST':
        return 'Invalid input provided';
      case 'ALREADY_EXISTS':
        return 'User with this email already exists';
      case 'UNAUTHORIZED':
        if (logout) {
          logout();
          window.location.href = '/login';
        }
        return 'Unauthorized access';
      case 'DATA_NOT_FOUND':
        return 'User not found';
      case 'CONFLICT':
        return 'User already exists or conflict occurred';
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

// Fixed getUserDetails method with proper logoUrl handling
export const getUserDetails = async (token: string, logout?: () => void): Promise<UserDetails> => {
  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    console.log('UserService: Fetching user details with token:', token.substring(0, 20) + '...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(`${API_BASE_URL}/users/api/v1/details`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UserService: HTTP error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Handle authentication errors
      if (response.status === 401 && logout) {
        logout();
        window.location.href = '/login';
      }

      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: UserDetailsApiResponse = await response.json();
    console.log('UserService: Raw API response:', data);

    // Validate response structure
    if (!data || !data.data || !data.data.data || !data.data.data.user) {
      console.error('UserService: Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }

    const user = data.data.data.user;

    // Normalize user data - FIXED: Only use logoUrl for user avatar, never store_logo
    const normalizedUser: UserDetails = {
      _id: user._id || user.id || '',
      name: user.name || 'Unknown User',
      email: user.email || '',
      user_type: user.user_type || 'worker',
      role_id: user.role_id || null,
      profile: user.profile || null,
      logoUrl: user.logoUrl || null, // ONLY use logoUrl for user avatar
      store_name: user.store_name || '',
      store_logo: user.store_logo || null, // Keep store_logo separate for business use
    };

    console.log('UserService: Normalized user data:', normalizedUser);
    return normalizedUser;

  } catch (error) {
    console.error('UserService: Error fetching user details:', error);

    // Handle different types of errors
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection.');
    }

    if (error.message.includes('401')) {
      throw new Error('Authentication failed. Please log in again.');
    }

    throw error;
  }
};

export const fetchUsers = async (token: string, logout: () => void): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Fetch users response status:', response.status);

    let data: ApiResponse;

    try {
      data = await response.json();
      console.log('Fetch users response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
    }

    // Handle specific HTTP status codes with proper error messages
    if (!response.ok) {
      // If we have a parsed response with error details, use handleApiError
      if (data && typeof data === 'object') {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      } else {
        // Fallback for cases where we can't parse the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Check if the response indicates failure even with 200 status
    if (data && !data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    // Validate response format
    if (data && data.type !== undefined && data.type !== 1) {
      throw new Error('Invalid response format from server');
    }

    if (data.success && data.type === 1 && data.data && 'data' in data.data) {
      return (data.data as { data: User[] }).data.map((user) => ({
        ...user,
        _id: user.id || user._id || '',
        role_id: user.role_id && typeof user.role_id === 'object' ? user.role_id.id : user.role_id || null,
        phone_number: user.profile?.phone_number || user.phone_number || '',
        job_title: user.profile?.job_title || user.job_title || '',
        shift_time: user.profile?.shift_time || user.shift_time || '',
        salary: user.profile?.salary || user.salary || 0,
        address: user.profile?.address || user.address || '',
        store_name: user.store_name || null,
        logoUrl: user.logoUrl || null, // FIXED: Only use logoUrl
        store_logo: user.store_logo || null, // Keep separate
      }));
    }
    throw new Error('Invalid response format: users data missing');
  } catch (error) {
    console.error('Fetch users error details:', error);

    // If it's already a handled error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    throw new Error('Failed to fetch users. Please try again.');
  }
};

export const fetchUserProfile = async (token: string, logout: () => void): Promise<User> => {
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/details`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      if (response.status === 401) {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(data.message || 'Failed to fetch user profile');
    }
    return {
      id: data.data.data.user.id,
      name: data.data.data.user.name,
      email: data.data.data.user.email,
      user_type: data.data.data.user.user_type,
      phone_number: data.data.data.user.phone_number,
      store_name: data.data.data.user.store_name,
      address: data.data.data.user.address,
      logoUrl: data.data.data.user.logoUrl, // FIXED: Only use logoUrl
      store_logo: data.data.data.user.store_logo, // Keep separate
    };
  } catch (err) {
    throw new Error(err.message || 'Failed to fetch user profile');
  }
};

// Keep the original fetchUserProfile function but update it to return UserDetails
export const fetchUserProfileOriginal = async (token: string, logout: () => void): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/api/v1/details`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Fetch user profile response status:', response.status);

    let data: ApiResponse;

    try {
      data = await response.json();
      console.log('Fetch user profile response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
    }

    // Handle specific HTTP status codes with proper error messages
    if (!response.ok) {
      // If we have a parsed response with error details, use handleApiError
      if (data && typeof data === 'object') {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      } else {
        // Fallback for cases where we can't parse the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Check if the response indicates failure even with 200 status
    if (data && !data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    // Validate response format
    if (data && data.type !== undefined && data.type !== 1) {
      throw new Error('Invalid response format from server');
    }

    let user: User;

    if (data.success && data.type === 1 && data.data) {
      if ('data' in data.data && 'user' in (data.data as any)) {
        user = (data.data as { data: { user: User } }).data.user;
      } else if ('data' in data.data) {
        user = (data.data as { data: User }).data;
      } else {
        user = data.data as User;
      }

      return {
        ...user,
        _id: user.id || user._id || '',
        role_id: user.role_id && typeof user.role_id === 'object' ? user.role_id.id : user.role_id || null,
        phone_number: user.profile?.phone_number || user.phone_number || '',
        job_title: user.profile?.job_title || user.job_title || '',
        shift_time: user.profile?.shift_time || user.shift_time || '',
        salary: user.profile?.salary || user.salary || 0,
        address: user.profile?.address || user.address || '',
        store_name: user.store_name || null,
        phone_number: user.phone_number || null,
        address: user.address || null,
        logoUrl: user.logoUrl || null, // FIXED: Only use logoUrl
        store_logo: user.store_logo || null, // Keep separate
      };
    }
    throw new Error('Invalid response format: user data missing');
  } catch (error) {
    console.error('Fetch user profile error details:', error);

    // If it's already a handled error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    throw new Error('Failed to fetch user profile. Please try again.');
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
      body: JSON.stringify({
        ...userData,
        role_id: userData.role_id || null, // Ensure role_id is null if not provided
        _id: undefined, // Remove _id from request as it's generated by backend
      }),
    });

    console.log('Create user response status:', response.status);

    let data: ApiResponse;

    try {
      data = await response.json();
      console.log('Create user response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
    }

    // Handle specific HTTP status codes with proper error messages
    if (!response.ok) {
      // If we have a parsed response with error details, use handleApiError
      if (data && typeof data === 'object') {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      } else {
        // Fallback for cases where we can't parse the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Check if the response indicates failure even with 200 status
    if (data && !data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    // Validate response format
    if (data && data.type !== undefined && data.type !== 1) {
      throw new Error('Invalid response format from server');
    }

    if (data.success && data.type === 1 && data.data) {
      const newUser = data.data as User;
      return {
        ...newUser,
        _id: newUser.id || newUser._id || '',
        role_id: newUser.role_id && typeof newUser.role_id === 'object' ? newUser.role_id.id : newUser.role_id || null,
        phone_number: newUser.profile?.phone_number || newUser.phone_number || '',
        job_title: newUser.profile?.job_title || newUser.job_title || '',
        shift_time: newUser.profile?.shift_time || newUser.shift_time || '',
        salary: newUser.profile?.salary || newUser.salary || 0,
        address: newUser.profile?.address || newUser.address || '',
        store_name: newUser.store_name || null,
        logoUrl: newUser.logoUrl || null, // FIXED: Only use logoUrl
        store_logo: newUser.store_logo || null, // Keep separate
      };
    }
    throw new Error('Invalid response format: user data missing');
  } catch (error) {
    console.error('Create user error details:', error);

    // If it's already a handled error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    throw new Error('Failed to create user. Please try again.');
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
      body: JSON.stringify({
        ...userData,
        role_id: userData.role_id || null, // Ensure role_id is null if not provided
        _id: userData._id, // Include _id for update
      }),
    });

    console.log('Update user response status:', response.status);

    let data: ApiResponse;

    try {
      data = await response.json();
      console.log('Update user response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
    }

    // Handle specific HTTP status codes with proper error messages
    if (!response.ok) {
      // If we have a parsed response with error details, use handleApiError
      if (data && typeof data === 'object') {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      } else {
        // Fallback for cases where we can't parse the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Check if the response indicates failure even with 200 status
    if (data && !data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    // Validate response format
    if (data && data.type !== undefined && data.type !== 1) {
      throw new Error('Invalid response format from server');
    }

    if (data.success && data.type === 1 && data.data) {
      const updatedUser = data.data as User;
      return {
        ...updatedUser,
        _id: updatedUser.id || updatedUser._id || '',
        role_id: updatedUser.role_id && typeof updatedUser.role_id === 'object' ? updatedUser.role_id.id : updatedUser.role_id || null,
        phone_number: updatedUser.profile?.phone_number || updatedUser.phone_number || '',
        job_title: updatedUser.profile?.job_title || updatedUser.job_title || '',
        shift_time: updatedUser.profile?.shift_time || updatedUser.shift_time || '',
        salary: updatedUser.profile?.salary || updatedUser.salary || 0,
        address: updatedUser.profile?.address || updatedUser.address || '',
        store_name: updatedUser.store_name || null,
        logoUrl: updatedUser.logoUrl || null, // FIXED: Only use logoUrl
        store_logo: updatedUser.store_logo || null, // Keep separate
      };
    }
    throw new Error('Invalid response format: user data missing');
  } catch (error) {
    console.error('Update user error details:', error);

    // If it's already a handled error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    throw new Error('Failed to update user. Please try again.');
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

    console.log('Delete user response status:', response.status);

    let data: ApiResponse;

    try {
      data = await response.json();
      console.log('Delete user response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
    }

    // Handle specific HTTP status codes with proper error messages
    if (!response.ok) {
      // If we have a parsed response with error details, use handleApiError
      if (data && typeof data === 'object') {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      } else {
        // Fallback for cases where we can't parse the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Check if the response indicates failure even with 200 status
    if (data && !data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    // Validate response format
    if (data && data.type !== undefined && data.type !== 1) {
      throw new Error('Invalid response format from server');
    }

    // Success - no return value needed for delete
  } catch (error) {
    console.error('Delete user error details:', error);

    // If it's already a handled error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    throw new Error('Failed to delete user. Please try again.');
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

    console.log('Assign role response status:', response.status);

    let data: ApiResponse;

    try {
      data = await response.json();
      console.log('Assign role response data:', data);
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new Error(`Server returned status ${response.status} but response was not valid JSON`);
    }

    // Handle specific HTTP status codes with proper error messages
    if (!response.ok) {
      // If we have a parsed response with error details, use handleApiError
      if (data && typeof data === 'object') {
        const errorMessage = handleApiError(data, logout);
        throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      } else {
        // Fallback for cases where we can't parse the response
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    // Check if the response indicates failure even with 200 status
    if (data && !data.success) {
      const errorMessage = handleApiError(data, logout);
      throw new Error(errorMessage);
    }

    // Validate response format
    if (data && data.type !== undefined && data.type !== 1) {
      throw new Error('Invalid response format from server');
    }

    if (data.success && data.type === 1 && data.data) {
      const updatedUser = 'data' in data.data ? (data.data as { data: User }).data : data.data as User;
      return {
        ...updatedUser,
        _id: updatedUser.id || updatedUser._id || '',
        role_id: updatedUser.role_id && typeof updatedUser.role_id === 'object' ? updatedUser.role_id.id : updatedUser.role_id || null,
        phone_number: updatedUser.profile?.phone_number || updatedUser.phone_number || '',
        job_title: updatedUser.profile?.job_title || updatedUser.job_title || '',
        shift_time: updatedUser.profile?.shift_time || updatedUser.shift_time || '',
        salary: updatedUser.profile?.salary || updatedUser.salary || 0,
        address: updatedUser.profile?.address || updatedUser.address || '',
        store_name: updatedUser.store_name || null,
        logoUrl: updatedUser.logoUrl || null, // FIXED: Only use logoUrl
        store_logo: updatedUser.store_logo || null, // Keep separate
      };
    }
    throw new Error('Invalid response format: user data missing');
  } catch (error) {
    console.error('Assign role error details:', error);

    // If it's already a handled error with a message, re-throw it
    if (error instanceof Error) {
      throw error;
    }

    // Fallback for unexpected errors
    throw new Error('Failed to assign role. Please try again.');
  }
};

// Class-based service similar to UserService.ts for consistency
export default class UserService {
  private static readonly BASE_URL = `${API_BASE_URL}/users/api/v1`;
  private static readonly TIMEOUT = 10000; // 10 seconds

  static async getUserDetails(token: string, logout?: () => void): Promise<UserDetails> {
    return getUserDetails(token, logout);
  }

  static async fetchUserProfile(token: string, logout?: () => void): Promise<UserDetails> {
    return this.getUserDetails(token, logout);
  }
}
