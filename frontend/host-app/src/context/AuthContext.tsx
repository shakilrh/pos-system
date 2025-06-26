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
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('Token loaded from localStorage:', storedToken);
          await refreshUserProfile(); // Refresh user profile
        } catch (error) {
          console.error('Error parsing user data:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

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
      console.log('Login response token:', token);

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify({ ...user, logoUrl: user.logoUrl || '' }));
      setToken(token);
      setUser({ ...user, logoUrl: user.logoUrl || '' });
      setIsAuthenticated(true);
      console.log('Auth state updated, token stored:', token);
      await refreshUserProfile(); // Refresh profile after login to get latest logoUrl
    } catch (error) {
      console.error('Login error:', error);
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
    console.log('Logged out, token removed from localStorage');
  };

  const refreshUserProfile = async () => {
    if (!token) {
      console.error('No token available to refresh user profile');
      return;
    }
    try {
      const updatedUser = await fetchUserProfile(token, logout);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log('User profile refreshed:', updatedUser);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout, setUser, refreshUserProfile }}>
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