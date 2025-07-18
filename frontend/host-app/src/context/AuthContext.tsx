'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
// Assuming fetchUserProfile is defined correctly in this path
// import { fetchUserProfile } from '../services/UserService';

// Mocking the service function for standalone compilation
const fetchUserProfile = (token: string, logout: () => void): Promise<any> => {
    console.log("Fetching user profile with token:", token);
    // In a real scenario, this would make an API call.
    // If the token is invalid, it should call logout().
    return Promise.resolve({
        id: 'mock-id-123',
        name: 'Mock User',
        email: 'user@example.com',
        user_type: 'admin',
        role_id: 'role-1',
        logoUrl: 'http://example.com/logo.png',
        store_name: 'Mock Store',
        store_logo: 'http://example.com/store_logo.png'
    });
};


// --- Type Definitions ---

interface User {
  _id: string;
  name: string;
  email: string;
  user_type: string;
  role_id: string | null;
  profile?: any; // Consider defining a more specific type for profile
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshUserProfile: () => Promise<void>;
}

// --- Constants ---

export const testMessage = "Module was loaded successfully";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT_MS = 10000; // 10 seconds

// --- Helper Functions ---

/**
 * Wraps a promise with a timeout.
 * Note the `<T,>` syntax, which is necessary for generic arrow functions in .tsx files
 * to avoid being parsed as a JSX tag.
 */
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
};

const decodeToken = (token: string): Partial<User> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
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

/**
 * Normalizes user data from different sources (API, localStorage) into a consistent User object.
 */
const normalizeUser = (userData: any, decodedTokenData?: Partial<User> | null): User => {
    return {
        ...userData,
        _id: userData._id || userData.id || '',
        name: userData.name || 'User',
        email: userData.email || '',
        user_type: decodedTokenData?.user_type || userData.user_type || 'worker',
        role_id: userData.role_id || null,
        logoUrl: userData.logoUrl || '',
        store_name: userData.store_name || '',
        store_logo: userData.store_logo || '',
    };
};


// --- Auth Context ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider Component ---

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setProfileError(null);
    console.log('Logged out successfully.');
  };

  const refreshUserProfile = async (): Promise<void> => {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) {
      setProfileError('No authentication token found.');
      return;
    }
    setProfileLoading(true);
    setProfileError(null);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const updatedUser = await withTimeout(fetchUserProfile(currentToken, logout), TIMEOUT_MS);
        const decodedTokenData = decodeToken(currentToken);
        const normalized = normalizeUser(updatedUser, decodedTokenData);

        localStorage.setItem('authUser', JSON.stringify(normalized));
        setUser(normalized);
        console.log('User profile refreshed successfully:', normalized);
        setProfileLoading(false);
        return;
      } catch (error) {
        console.error(`Error refreshing user profile (attempt ${attempt}):`, error);
        if (attempt === MAX_RETRIES) {
          setProfileError('Failed to load user profile after multiple retries.');
        } else {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }
    setProfileLoading(false);
  };

  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(normalizeUser(parsedUser));
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data from storage:', error);
          logout(); // Clear corrupted data
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // This effect will trigger a profile refresh when the component mounts with existing credentials.
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshUserProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setProfileError(null);
    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Login failed due to server error');
      }

      const { token: apiToken, user: apiUser } = responseData.data.data;
      if (!apiToken || !apiUser) {
        throw new Error('Invalid response from login API');
      }

      const normalized = normalizeUser(apiUser);

      localStorage.setItem('authToken', apiToken);
      localStorage.setItem('authUser', JSON.stringify(normalized));
      setToken(apiToken);
      setUser(normalized);
      setIsAuthenticated(true);
      console.log('Login successful, auth state updated.');
    } catch (error: any) {
      console.error('Login error:', error);
      setProfileError(error.message || 'An unknown login error occurred');
      logout(); // Ensure clean state on login failure
      throw error; // Re-throw for the calling component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    profileLoading,
    profileError,
    user,
    token,
    login,
    logout,
    setUser,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook ---

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext, AuthProvider, useAuth };
