import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Store, Home, ShoppingBag, BarChart3, PlusCircle, Users, Database } from 'lucide-react';

// UserService implementation (based on your provided code)
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
  phone_number?: string;
  address?: string;
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

class UserService {
  private static readonly BASE_URL = 'http://192.168.18.37:3000/users/api/v1';
  private static readonly TIMEOUT = 10000;

  static async getUserDetails(token: string): Promise<UserDetails> {
    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
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
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: ApiResponse = await response.json();

      if (!data || !data.data || !data.data.data || !data.data.data.user) {
        throw new Error('Invalid API response structure');
      }

      const user = data.data.data.user;

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
        phone_number: user.phone_number || '',
        address: user.address || '',
      };

      return normalizedUser;

    } catch (error) {
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
}

interface FooterProps {
  sidebarOpen?: boolean;
}

const UserFooter = ({ sidebarOpen = true }: FooterProps) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock token - replace with your actual token from auth context/localStorage
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Replace with actual token

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const { theme } = e.detail;
      document.documentElement.setAttribute('data-theme', theme);
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real app, get token from your auth context or localStorage
        const token = localStorage.getItem('authToken') || mockToken;

        if (!token) {
          throw new Error('No authentication token found');
        }

        const userData = await UserService.getUserDetails(token);
        setUserDetails(userData);
      } catch (err) {
        setError(err.message || 'Failed to load user data');
        console.error('Footer: Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <footer
        className={`mt-auto p-4 shadow-inner transition-all duration-300 ease-in-out`}
        style={{
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'var(--border-color)',
          width: sidebarOpen ? 'calc(100% - 256px)' : 'calc(100% - 80px)',
          marginLeft: sidebarOpen ? '256px' : '80px'
        }}
      >
        <div className="container mx-auto flex items-center justify-center text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
          <span className="ml-2" style={{ color: 'var(--primary-color)' }}>Loading store information...</span>
        </div>
      </footer>
    );
  }

  if (error) {
    return (
      <footer
        className={`mt-auto p-4 shadow-inner transition-all duration-300 ease-in-out`}
        style={{
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'var(--border-color)',
          width: sidebarOpen ? 'calc(100% - 256px)' : 'calc(100% - 80px)',
          marginLeft: sidebarOpen ? '256px' : '80px'
        }}
      >
        <div className="container mx-auto text-center text-sm">
          <span className="text-red-400">Error: {error}</span>
        </div>
      </footer>
    );
  }

  if (!userDetails) {
    return null;
  }

  const displayLogo = userDetails.store_logo || userDetails.logoUrl;

  return (
    <footer
      className={`mt-auto p-4 shadow-inner transition-all duration-300 ease-in-out`}
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border-color)',
        width: sidebarOpen ? 'calc(100% - 256px)' : 'calc(100% - 80px)',
        marginLeft: sidebarOpen ? '256px' : '80px'
      }}
    >
      <div className="container mx-auto">
        {/* Main Store Information Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

          {/* Store Info Section */}
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt="Store Logo"
                className="w-10 h-10 rounded-lg object-cover border shadow-sm"
                style={{ borderColor: 'var(--border-color)' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--background-primary)', borderColor: 'var(--border-color)' }}>
                <Store className="w-5 h-5" style={{ color: 'var(--primary-color)' }} />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-base" style={{ color: 'var(--primary-color)' }}>
                {userDetails.store_name || userDetails.name}
              </h3>
              {userDetails.address && (
                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-3 h-3" />
                  <span>{userDetails.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--primary-color)' }}>
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              {userDetails.email && (
                <a
                  href={`mailto:${userDetails.email}`}
                  className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
                >
                  <Mail className="w-3 h-3" />
                  <span>{userDetails.email}</span>
                </a>
              )}
              {userDetails.phone_number && (
                <a
                  href={`tel:${userDetails.phone_number}`}
                  className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                  style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
                >
                  <Phone className="w-3 h-3" />
                  <span>{userDetails.phone_number}</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--primary-color)' }}>
              <Database className="w-4 h-4" />
              <span>Quick Links</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="/Dashboard/dashboard"
                className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
              >
                <Home className="w-3 h-3" />
                <span>Dashboard</span>
              </a>
              <a
                href="/MenuManagement"
                className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Menu</span>
              </a>
              <a
                href="/Orders/orders"
                className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Orders</span>
              </a>
              <a
                href="/Orders/createOrder"
                className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
              >
                <PlusCircle className="w-3 h-3" />
                <span>Create Order</span>
              </a>
              <a
                href="/RoleAndUserManagement"
                className="flex items-center gap-1 transition-colors hover:opacity-80 px-2 py-1 rounded"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--background-primary)' }}
              >
                <Users className="w-3 h-3" />
                <span>Roles</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="flex items-center justify-center mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
          <span>© {new Date().getFullYear()} {userDetails.store_name || userDetails.name}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;
