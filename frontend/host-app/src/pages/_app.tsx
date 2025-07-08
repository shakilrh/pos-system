import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import 'shared-tailwind/styles';
import '@fontsource/nunito';

const FallbackHeader = () => <div>Header failed to load</div>;
const FallbackFooter = () => <div>Footer failed to load</div>;

const Header = dynamic(
  () => import('remoteApp/Header').catch((err) => {
    console.error('Header load error:', err);
    return () => FallbackHeader;
  }),
  { ssr: false }
);

import Sidebar from '../components/Sidebar';

const Footer = dynamic(
  () => import('remoteApp/Footer').catch((err) => {
    console.error('Footer load error:', err);
    return () => FallbackFooter;
  }),
  { ssr: false }
);

const publicRoutes = ['/Registration/login', '/Registration/forgotPassword', '/Registration/registerAdmin', '/NoAccess'];

// Map routes to required permissions
const routePermissions: { [key: string]: string } = {
  '/Dashboard/dashboard': 'Dashboard_access',
  '/MenuManagement': 'Menu_access',
  '/Orders/orders': 'Orders_access',
  '/Orders/createOrder': 'Orders_can_create',
  '/RoleAndUserManagement': 'Roles_access',
};

// Map permission IDs to keys
const permissionIdToKey: { [key: string]: string } = {
  '6867aac3a50a9ccaa7143a05': 'Dashboard_access',
  '6867ab13a50a9ccaa7143a0f': 'Orders_access',
  '6867adc7a50a9ccaa7143a48': 'Orders_can_create',
  '6867aaeca50a9ccaa7143a09': 'Menu_access',
  '6867ab5da50a9ccaa7143a13': 'Roles_access',
  '6867ab88a50a9ccaa7143a17': 'Settings_access',
  // Add mappings for additional permissions if needed
};

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const { isAuthenticated, isLoading, logout, token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Decode JWT token to extract role_id and permissions
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

  // Extract permissions from token
  useEffect(() => {
    console.log('Permission extraction useEffect triggered', {
      isAuthenticated,
      token: !!token,
      user_role_id: user?.role_id,
      isLoading
    });

    // Wait for authentication to be fully loaded
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

    // Check if user is admin - if so, grant all permissions
    if (decodedToken.user_type === 'isadmin') {
      const allPermissions = Object.values(permissionIdToKey);
      console.log('User is admin, granting all permissions:', allPermissions);
      setUserPermissions(allPermissions);
      setPermissionsLoaded(true);

      // Log admin access
      console.log('Admin User:', {
        role_id: decodedToken.role_id,
        name: user?.name || 'Unknown',
        user_type: decodedToken.user_type,
        description: 'Admin with full access',
      });
      return;
    }

    // Map permission IDs to keys for non-admin users
    const permissions = Array.isArray(decodedToken.permissions)
      ? decodedToken.permissions
        .map((id: string) => permissionIdToKey[id])
        .filter((key: string | undefined) => key !== undefined)
      : [];

    console.log('Mapped permissions for non-admin user:', permissions);
    setUserPermissions(permissions);
    setPermissionsLoaded(true);

    // Log role and permissions for debugging
    console.log('Regular User Role:', {
      role_id: decodedToken.role_id,
      name: user?.name || 'Unknown',
      user_type: decodedToken.user_type,
      description: 'From token',
    });
    console.log('Assigned Permissions:', permissions);
  }, [isAuthenticated, user, token, isLoading]);

  // Authentication and permission check
  useEffect(() => {
    console.log('Route protection useEffect triggered', {
      isLoading,
      isAuthenticated,
      pathname,
      permissionsLoaded,
      userPermissions
    });

    if (isLoading) {
      console.log('Auth still loading, skipping route protection');
      return;
    }

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      console.log('Redirecting to login: User not authenticated');
      router.push('/Registration/login');
      return;
    }

    if (isAuthenticated && pathname === '/Registration/login') {
      console.log('Redirecting to dashboard: User authenticated on login page');
      router.push('/Dashboard/dashboard');
      return;
    }

    if (isAuthenticated && !publicRoutes.includes(pathname)) {
      // Wait for permissions to be loaded before checking access
      if (!permissionsLoaded) {
        console.log('Permissions not loaded yet, waiting...');
        return;
      }

      const requiredPermission = routePermissions[pathname];
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        console.log(`Access denied to ${pathname}: Missing permission ${requiredPermission}`);
        console.log('User permissions:', userPermissions);
        router.push('/NoAccess');
      } else {
        console.log(`Access granted to ${pathname}`);
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, userPermissions, permissionsLoaded]);

  // Page loading effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleRouteChange = () => {
      setIsPageLoading(true);
      timeoutId = setTimeout(() => setIsPageLoading(false), 500);
    };

    const prevPathname = pathname;
    const checkPathChange = () => {
      if (prevPathname !== pathname) {
        handleRouteChange();
      }
    };

    const interval = setInterval(checkPathChange, 100);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setSidebarOpen(false);
      setUserPermissions([]);
      setPermissionsLoaded(false);
      console.log('User logged out successfully');
      await router.push('/Registration/login');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/Registration/login';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated && publicRoutes.includes(pathname)) {
    return <Component {...pageProps} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show loading while permissions are being loaded
  if (isAuthenticated && !permissionsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!Sidebar) {
    console.error('Sidebar component is undefined');
    return <div>Sidebar failed to load</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onNavigate={(path: string) => router.push(path)}
        token={token}
        user={user}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          className={`top-16 z-40 ${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl`}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          userPermissions={userPermissions}
        />
        <main className={`flex-1 mt-16 bg-gray-100 overflow-auto ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          {isPageLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
              </div>
            </div>
          ) : (
            <Component {...pageProps} key={pathname} />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
