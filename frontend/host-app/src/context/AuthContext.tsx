'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { fetchUserProfile } from '../services/UserService';

interface User {
  _id: string;
  name: string;
  email: string;
  user_type: string; // 'worker', 'isadmin', or 'customer'
  role_id?: string | null;
  profile?: any;
  logoUrl?: string;
  store_name?: string;
  store_logo?: string;
  phone?: string; // Added for customer
  phone_number?: string;
  addresses?: string[];
  address?: string;
  verified?: boolean; // Added for customer
}

interface Permission {
  _id: string;
  key: string;
  name: string;
  description: string;
}

interface MainPage {
  _id: string;
  key: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  user: User | null;
  token: string | null;
  userPermissions: string[];
  permissionsLoaded: boolean;
  allPermissions: string[];
  storeName: string;
  restaurantSlug: string;
  login: (email: string, passwordOrOtp: string, isCustomer?: boolean) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';
const DEBOUNCE_MS = 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const TIMEOUT_MS = 10000;

const createSlug = (storeName: string): string => {
  return storeName
      ? storeName
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
      : '';
};

const fetchMainPages = async (token: string, logout: () => void): Promise<MainPage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/pages/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch main pages');
    }
    return data.data?.data || [];
  } catch (err) {
    console.error('Error fetching main pages:', err);
    return [];
  }
};

const normalizeUser = (apiUser: any, email?: string): User => {
  return {
    _id: apiUser._id || apiUser.id || '',
    name: apiUser.name || 'User',
    email: apiUser.email || email || '',
    user_type: apiUser.user_type || 'customer',
    role_id: apiUser.role_id || null,
    logoUrl: apiUser.logoUrl || '',
    store_name: apiUser.store_name || '',
    store_logo: apiUser.store_logo || '',
    phone: apiUser.phone || apiUser.phone_number || '',
    phone_number: apiUser.phone_number || apiUser.phone || '',
    addresses: apiUser.addresses || [],
    address: apiUser.address || (apiUser.addresses && apiUser.addresses[0]) || '',
    verified: apiUser.verified || false,
  };
};

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [storeName, setStoreName] = useState<string>('');
  const [restaurantSlug, setRestaurantSlug] = useState<string>('');
  const fetchInProgress = useRef(false);
  const lastFetchTime = useRef(0);

  const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    });
    return Promise.race([promise, timeout]);
  };

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
          atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const refreshUserProfile = async (tokenParam?: string): Promise<void> => {
    const currentToken = tokenParam || token;
    if (!currentToken || fetchInProgress.current) return;

    const now = Date.now();
    if (now - lastFetchTime.current < DEBOUNCE_MS) return;

    fetchInProgress.current = true;
    lastFetchTime.current = now;
    setProfileLoading(true);
    setProfileError(null);

    try {
      const updatedUser = await withTimeout(fetchUserProfile(currentToken, logout), TIMEOUT_MS);
      const normalizedUser = normalizeUser(updatedUser);

      localStorage.setItem('authUser', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      const slug = normalizedUser.store_name ? createSlug(normalizedUser.store_name) : '';
      setStoreName(normalizedUser.store_name || '');
      setRestaurantSlug(slug);
      localStorage.setItem('storeName', normalizedUser.store_name || '');
      localStorage.setItem('restaurantSlug', slug);

      console.log('User profile refreshed successfully:', normalizedUser);
    } catch (error: any) {
      console.error('Error refreshing user profile:', error);
      if (error.message !== 'Request timed out' && MAX_RETRIES > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return refreshUserProfile(currentToken);
      }
      setProfileError(error.message || 'Failed to load user profile');
      // Preserve existing user data if available
      if (user) {
        setUser((prev) => prev ? normalizeUser(prev) : null);
      }
    } finally {
      fetchInProgress.current = false;
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      const storedStoreName = localStorage.getItem('storeName') || '';
      const storedSlug = localStorage.getItem('restaurantSlug') || '';

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const normalizedUser = normalizeUser(parsedUser);

          setToken(storedToken);
          setUser(normalizedUser);
          setStoreName(storedStoreName);
          setRestaurantSlug(storedSlug);
          setIsAuthenticated(true);

          // Only fetch permissions for non-customers
          if (normalizedUser.user_type !== 'customer') {
            try {
              const mainPages = await fetchMainPages(storedToken, logout);
              const permissions = mainPages.flatMap((page) => page.permissions.map((perm) => perm.key));
              setAllPermissions(permissions);

              const decodedToken = decodeToken(storedToken);
              if (decodedToken) {
                const userPerms = decodedToken.user_type === 'isadmin'
                    ? permissions
                    : Array.isArray(decodedToken.permissions)
                        ? decodedToken.permissions.filter((key: string) => typeof key === 'string')
                        : [];
                setUserPermissions(userPerms);
                setPermissionsLoaded(true);
              } else {
                setUserPermissions([]);
                setPermissionsLoaded(true);
              }
            } catch (error) {
              console.error('Failed to fetch permissions:', error);
              setUserPermissions([]);
              setPermissionsLoaded(true);
            }
          } else {
            setUserPermissions([]);
            setPermissionsLoaded(true);
          }

          // Always refresh user profile after initialization
          await refreshUserProfile(storedToken);
        } catch (error) {
          console.error('Error initializing auth:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, passwordOrOtp: string, isCustomer: boolean = false) => {
    setIsLoading(true);
    try {
      const endpoint = isCustomer ? '/users/api/v1/customer-login' : '/users/api/v1/login';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isCustomer ? { email, code: passwordOrOtp } : { email, password: passwordOrOtp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const responseData = await response.json();
      // Handle different response structures
      const data = responseData.data?.data || responseData.data || {};
      const { token, ...apiUser } = data;

      if (!token) {
        throw new Error('No token received');
      }

      const normalizedUser = normalizeUser({
        ...apiUser,
        user_type: isCustomer ? 'customer' : apiUser.user_type || 'worker',
        role_id: isCustomer ? null : apiUser.role_id || null,
      }, email);

      // Handle permissions based on user type
      if (isCustomer) {
        setUserPermissions([]);
        setPermissionsLoaded(true);
        setAllPermissions([]);
      } else {
        const mainPages = await fetchMainPages(token, logout);
        const permissions = mainPages.flatMap((page) => page.permissions.map((perm) => perm.key));
        setAllPermissions(permissions);

        const decodedToken = decodeToken(token);
        if (!decodedToken) {
          throw new Error('Failed to decode token');
        }

        const userPerms = decodedToken.user_type === 'isadmin'
            ? permissions
            : Array.isArray(decodedToken.permissions)
                ? decodedToken.permissions.filter((key: string) => typeof key === 'string')
                : [];
        setUserPermissions(userPerms);
        setPermissionsLoaded(true);
      }

      const slug = normalizedUser.store_name ? createSlug(normalizedUser.store_name) : '';
      setStoreName(normalizedUser.store_name || '');
      setRestaurantSlug(slug);

      // Store data
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(normalizedUser));
      localStorage.setItem('storeName', normalizedUser.store_name || '');
      localStorage.setItem('restaurantSlug', slug);

      // Set state
      setToken(token);
      setUser(normalizedUser);
      setIsAuthenticated(true);

      // Immediately refresh user profile after login
      await refreshUserProfile(token);
      window.dispatchEvent(new Event('settingsChanged'));

      return normalizedUser;
    } catch (error) {
      console.error('Login error:', error);
      setProfileError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('restaurantSlug');
    localStorage.removeItem('storeName');
    localStorage.removeItem('appTheme');
    localStorage.removeItem('appCurrency');
    setToken(null);
    setUser(null);
    setStoreName('');
    setRestaurantSlug('');
    setIsAuthenticated(false);
    setProfileError(null);
    setUserPermissions([]);
    setPermissionsLoaded(false);
    setAllPermissions([]);
  };

  return (
      <AuthContext.Provider
          value={{
            isAuthenticated,
            isLoading,
            profileLoading,
            profileError,
            user,
            token,
            userPermissions,
            permissionsLoaded,
            allPermissions,
            storeName,
            restaurantSlug,
            login,
            logout,
            setUser,
            refreshUserProfile,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, AuthProvider };