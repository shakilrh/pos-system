interface UserDetails {
  _id: string;
  name: string;
  email: string;
  user_type: string;
  role_id: string | null;
  profile?: any;
  logoUrl?: string;
  store_name?: string;
  store_logo?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    data: {
      user: UserDetails;
    };
  };
}

export default class UserService {
  private static readonly BASE_URL = 'http://192.168.18.107:3000/users/api/v1';
  private static readonly TIMEOUT = 10000; // 10 seconds

  static async getUserDetails(token: string): Promise<UserDetails> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      console.log('UserService: Fetching user details with token:', token.substring(0, 20) + '...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(`${this.BASE_URL}/details`, {
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
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: ApiResponse = await response.json();
      console.log('UserService: Raw API response:', data);

      // Validate response structure
      if (!data || !data.data || !data.data.data || !data.data.data.user) {
        console.error('UserService: Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }

      const user = data.data.data.user;

      // Normalize user data
      const normalizedUser: UserDetails = {
        _id: user._id || '',
        name: user.name || 'Unknown User',
        email: user.email || '',
        user_type: user.user_type || 'worker',
        role_id: user.role_id || null,
        profile: user.profile || null,
        logoUrl: user.logoUrl || user.store_logo || '',
        store_name: user.store_name || '',
        store_logo: user.store_logo || user.logoUrl || '',
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
  }

  // Alternative method to get user profile (for AuthContext)
  static async fetchUserProfile(token: string): Promise<UserDetails> {
    return this.getUserDetails(token);
  }
}

// Export a function that can be used in AuthContext
export const fetchUserProfile = async (token: string, onLogout?: () => void): Promise<UserDetails> => {
  try {
    return await UserService.getUserDetails(token);
  } catch (error) {
    console.error('fetchUserProfile error:', error);

    // If authentication failed, trigger logout
    if (error.message.includes('401') || error.message.includes('Authentication failed')) {
      console.log('Authentication failed, triggering logout...');
      if (onLogout) {
        onLogout();
      }
    }

    throw error;
  }
};
