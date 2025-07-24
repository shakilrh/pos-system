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

// Map routes to actual database permissions
const routePermissions: { [key: string]: string } = {
  '/Dashboard/dashboard': 'can_view_dashboard',
  '/MenuManagement': 'can_view_menu',
  '/Orders/orders': 'can_view_orders',
  '/Orders/createOrder': 'create_orders',
  '/RoleAndUserManagement': 'can_view_rolemanagement',
  '/Tables/FloorTableManagement': 'can_view_tablemanagement',
};

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
  'manage_users',
  'manage_roles',
  'manage_permissions',
  'manage_tables',
  'manage_floors',
  'assign_tables',
  'manage_store_settings',
  'manage_store_profile',
];

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const { isAuthenticated, isLoading, logout, token, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    console.log('Permission extraction useEffect triggered', {
      isAuthenticated,
      token: !!token,
      user_role_id: user?.role_id,
      isLoading
    });

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

      console.log('Admin User:', {
        role_id: decodedToken.role_id,
        name: user?.name || 'Unknown',
        user_type: decodedToken.user_type,
        description: 'Admin with full access',
      });
      return;
    }

    const permissions = Array.isArray(decodedToken.permissions)
      ? decodedToken.permissions.filter((key: string) => typeof key === 'string')
      : [];

    console.log('Mapped permissions for non-admin user:', permissions);
    setUserPermissions(permissions);
    setPermissionsLoaded(true);

    console.log('Regular User Role:', {
      role_id: decodedToken.role_id,
      name: user?.name || 'Unknown',
      user_type: decodedToken.user_type,
      description: 'From token',
    });
    console.log('Assigned Permissions:', permissions);
  }, [isAuthenticated, user, token, isLoading]);

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
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
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

  if (isAuthenticated && !permissionsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
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

  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20';
  const contentMargin = sidebarOpen ? 'ml-64' : 'ml-20';
  const headerHeight = 'h-16';

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
      <Header
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onNavigate={(path: string) => router.push(path)}
        token={token}
        user={user}
        className={headerHeight}
      />
      <div className="flex flex-1 overflow-hidden mt-10" style={{ backgroundColor: 'var(--background-color)' }}>
        <Sidebar
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 ${sidebarWidth} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl transition-all duration-300 ease-in-out`}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          userPermissions={userPermissions}
        />
        <main className={`flex-1 ${contentMargin} overflow-auto p-4 transition-all duration-300 ease-in-out`} style={{ backgroundColor: 'var(--background-color)' }}>
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
