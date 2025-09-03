'use client';
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { loginUser, getUserPermissions, createSlug } from '../services/AuthService';
import {  refreshUserProfile as refreshProfile} from '../services/AuthService';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    setUserPermissions([]);
    setPermissionsLoaded(false);
    setAllPermissions([]);
    setProfileError(null);
  };

  const refreshUserProfile = async () => {
    if (!token) {
      throw new Error('No authentication token');
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const updatedUser = await refreshProfile(token);
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      setProfileError(error instanceof Error ? error.message : 'Failed to refresh profile');
      throw error;
    } finally {
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
          setToken(storedToken);
          setUser(parsedUser);
          setStoreName(storedStoreName);
          setRestaurantSlug(storedSlug);
          setIsAuthenticated(true);

          // Load permissions for non-customers
          if (parsedUser.user_type !== 'customer') {
            try {
              const { userPermissions: userPerms, allPermissions: allPerms } = await getUserPermissions(storedToken);
              setUserPermissions(userPerms);
              setAllPermissions(allPerms);
            } catch (error) {
              console.error('Failed to load permissions:', error);
            }
          }
          setPermissionsLoaded(true);
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
      const { token: newToken, user: newUser } = await loginUser(email, passwordOrOtp, isCustomer);

      // Handle permissions
      if (!isCustomer) {
        try {
          const { userPermissions: userPerms, allPermissions: allPerms } = await getUserPermissions(newToken);
          setUserPermissions(userPerms);
          setAllPermissions(allPerms);
        } catch (error) {
          console.error('Failed to load permissions:', error);
          setUserPermissions([]);
          setAllPermissions([]);
        }
      } else {
        setUserPermissions([]);
        setAllPermissions([]);
      }

      const slug = newUser.store_name ? createSlug(newUser.store_name) : '';
      setStoreName(newUser.store_name || '');
      setRestaurantSlug(slug);

      // Store data
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('authUser', JSON.stringify(newUser));
      localStorage.setItem('storeName', newUser.store_name || '');
      localStorage.setItem('restaurantSlug', slug);

      // Set state
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
      setPermissionsLoaded(true);

      window.dispatchEvent(new Event('settingsChanged'));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
            refreshUserProfile,
            login,
            logout,
            setUser,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext, AuthProvider };
export default AuthProvider;