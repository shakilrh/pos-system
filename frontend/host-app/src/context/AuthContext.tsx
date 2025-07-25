'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { fetchUserProfile } from '../services/UserService';

interface User {
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

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profileLoading: boolean;
  profileError: string | null;
  user: User | null;
  token: string | null;
  userPermissions: string[];
  permissionsLoaded: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of all actual database permissions for admin users
const ALL_PERMISSIONS = [
  'can_view_dashboard',
  'can_view_menu',
  'can_view_orders',
  'create_orders',
  'can_view_rolemanagement',
  'can_view_tablemanagement',
  'can_view_storesettings',
  'can_add_categories',
  'can_edit_categories',
  'can_delete_categories',
  'can_add_products',
  'can_edit_products',
  'can_delete_products',
  'manage_prepared_orders',
  'manage_ready_orders',
  'manage_served_orders',
  'manage_completed_orders',
  'accept_onlineorders',
  'manage_cancelled_orders',
  'can_add_users',
  'can_edit_users',
  'can_delete_users',
  'assign_roles',
  'can_add_roles',
  'can_edit_roles',
  'can_delete_roles',
  'can_add_permissions',
  'can_edit_permissions',
  'can_delete_permissions',
  'assign_permissions',
  'can_add_floors',
  'can_edit_floors',
  'can_delete_floors',
  'can_add_tables',
  'can_edit_tables',
  'can_delete_tables',
  'manage_floors',
  'assign_tables',
  'manage_store_settings',
  'manage_store_profile',
];

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  const TIMEOUT_MS = 10000; // 10 seconds

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
    if (!currentToken) {
      console.error('No token available to refresh user profile', { token, tokenParam });
      setProfileError('No authentication token');
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      const updatedUser = await withTimeout(fetchUserProfile(currentToken, logout), TIMEOUT_MS);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log('User profile refreshed successfully:', updatedUser);
    } catch (error) {
      console.error('Error refreshing user profile:', error, { token: currentToken });
      if (MAX_RETRIES > 0) {
        console.log(`Retrying user profile refresh, ${MAX_RETRIES} attempts left`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return refreshUserProfile(currentToken);
      }
      setProfileError('Failed to load user profile after retries');
      setUser((prev) => ({
        ...prev,
        _id: prev?._id || '',
        name: prev?.name || 'User',
        email: prev?.email || '',
        user_type: prev?.user_type || 'worker',
        role_id: prev?.role_id || null,
        logoUrl: prev?.logoUrl || '',
        store_name: prev?.store_name || '',
        store_logo: prev?.store_logo || '',
      }));
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const normalizedUser = {
            ...parsedUser,
            _id: parsedUser._id || parsedUser.id || '',
            name: parsedUser.name || 'User',
            email: parsedUser.email || '',
            user_type: parsedUser.user_type || 'worker',
            role_id: parsedUser.role_id || null,
            logoUrl: parsedUser.logoUrl || '',
            store_name: parsedUser.store_name || '',
            store_logo: parsedUser.store_logo || '',
          };
          setToken(storedToken);
          setUser(normalizedUser);
          setIsAuthenticated(true);
          console.log('Token loaded from localStorage:', storedToken);
          console.log('User loaded from localStorage:', normalizedUser);
        } catch (error) {
          console.error('Error parsing user data:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) {
      console.log('Still loading auth, skipping permission extraction');
      return;
    }

    if (!isAuthenticated || !token) {
      console.log('No authentication or token, clearing permissions');
      setUserPermissions([]);
      setPermissionsLoaded(true);
      return;
    }

    const decodedToken = decodeToken(token);
    if (!decodedToken) {
      console.error('Failed to decode token');
      setUserPermissions([]);
      setPermissionsLoaded(true);
      return;
    }

    console.log('Decoded token:', decodedToken);

    if (decodedToken.user_type === 'isadmin') {
      console.log('User is admin, granting all permissions:', ALL_PERMISSIONS);
      setUserPermissions(ALL_PERMISSIONS);
      setPermissionsLoaded(true);
      return;
    }

    const permissions = Array.isArray(decodedToken.permissions)
      ? decodedToken.permissions.filter((key: string) => typeof key === 'string')
      : [];

    console.log('Mapped permissions for non-admin user:', permissions);
    setUserPermissions(permissions);
    setPermissionsLoaded(true);
  }, [isAuthenticated, token, isLoading]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const responseData = await response.json();
      const { token, user } = responseData.data.data;
      console.log('Login response:', { token, user });

      if (!token) {
        throw new Error('No token received from login API');
      }

      const normalizedUser = {
        ...user,
        _id: user._id || user.id || '',
        role_id: user.role_id || null,
        logoUrl: user.logoUrl || '',
        name: user.name || 'User',
        store_name: user.store_name || '',
        store_logo: user.store_logo || '',
      };

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(normalizedUser));
      setToken(token);
      setUser(normalizedUser);
      setIsAuthenticated(true);
      console.log('Auth state updated, token stored:', token);
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
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setProfileError(null);
    setUserPermissions([]);
    setPermissionsLoaded(false);
    console.log('Logged out, token removed from localStorage');
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
