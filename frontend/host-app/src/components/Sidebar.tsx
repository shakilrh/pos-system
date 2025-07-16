import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  PlusCircleIcon,
  TableCellsIcon, Square3Stack3DIcon, ViewColumnsIcon
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import UserService from '../services/UserService';

// --- Helper Components ---
const FallbackIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ActiveUserIcon = () => (
  <svg className="w-3 h-3 ml-1.5" fill="currentColor" viewBox="0 0 12 12" style={{ color: 'var(--primary-color)' }}>
    <circle cx="6" cy="6" r="5" />
  </svg>
);

// Define User interface to match the one in Header
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

// --- Navigation Structure ---Tables/TableManagement
const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/Dashboard/dashboard', description: 'Overview of your account', permission: 'Dashboard_access' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement', description: 'Manage your menu items', permission: 'Menu_access' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders/orders', description: 'View and manage orders', permission: 'Orders_access' },
  { name: 'Create Orders', icon: PlusCircleIcon || FallbackIcon, href: '/Orders/createOrder', description: 'Create new orders', permission: 'Orders_can_create' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement', description: 'Control user roles', permission: 'Roles_access' },
  { name: 'Tables Management', icon: Square3Stack3DIcon || FallbackIcon, href: '/Tables/FloorTableManagement', description: 'Control Tables | Floors', permission: 'Tables_access' }

];

// --- Component Props ---
interface SidebarProps {
  className: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userPermissions: string[];
}

// --- Sidebar Component ---
export default function Sidebar({ className, sidebarOpen, setSidebarOpen, userPermissions }: SidebarProps) {
  const pathname = usePathname();
  const { user, profileLoading, profileError, token } = useAuth();
  const [theme, setTheme] = useState('default');
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'default';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleThemeChange = (e: CustomEvent) => {
      setTheme(e.detail.theme);
      document.documentElement.setAttribute('data-theme', e.detail.theme);
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, []);

  // Fetch detailed user data using UserService - same as Header
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        console.log('No token available for fetching user data in sidebar');
        // Use fallback data from AuthContext
        setUserDetails(user);
        return;
      }

      setIsLoadingUserDetails(true);
      try {
        console.log('Sidebar: Fetching user details with token:', token);
        const response = await UserService.getUserDetails(token);
        console.log('Sidebar: User details response:', response);

        // Set user details from API response
        setUserDetails(response);
      } catch (err) {
        console.error('Sidebar: Fetch user data error:', err);
        // Use fallback data from AuthContext in case of error
        setUserDetails(user);
      } finally {
        setIsLoadingUserDetails(false);
      }
    };

    fetchUserData();
  }, [token, user]);

  // Get user display name with proper fallbacks
  const getUserDisplayName = () => {
    if (isLoadingUserDetails || profileLoading) return 'Loading...';
    return userDetails?.name || user?.name || 'User';
  };

  // Get user email with proper fallbacks
  const getUserEmail = () => {
    if (isLoadingUserDetails || profileLoading) return 'Loading...';
    return userDetails?.email || user?.email || 'user@example.com';
  };

  // Get user avatar URL with proper fallbacks
  const getUserAvatar = () => {
    return userDetails?.logoUrl || user?.logoUrl || userDetails?.store_logo || user?.store_logo || '/file.svg';
  };

  // Get user role display
  const getUserRole = () => {
    if (isLoadingUserDetails || profileLoading) return 'Loading...';
    const currentUser = userDetails || user;
    if (currentUser?.user_type === 'isadmin') return 'Administrator';
    return currentUser?.user_type || 'User';
  };

  const ProfileSection = () => (
    <div className="flex items-center">
      {(isLoadingUserDetails || profileLoading) ? (
        <div className="w-10 h-10 mr-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
      ) : (
        <img
          src={getUserAvatar()}
          alt="User avatar"
          className="w-10 h-10 mr-3 rounded-full object-cover border-2"
          style={{ borderColor: 'var(--primary-color)' }}
          onError={(e) => {
            e.currentTarget.src = '/file.svg';
          }}
        />
      )}
      <div className="overflow-hidden">
        <div className="text-lg font-bold truncate flex items-center text-white">
          {(isLoadingUserDetails || profileLoading) ? (
            <div className="w-24 h-5 animate-pulse rounded" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
          ) : (
            <>
              {getUserDisplayName()} <ActiveUserIcon />
            </>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>
          {(isLoadingUserDetails || profileLoading) ? (
            <div className="w-20 h-3 animate-pulse rounded" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
          ) : (
            getUserEmail()
          )}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)', opacity: 0.8 }}>
          {(isLoadingUserDetails || profileLoading) ? (
            <div className="w-16 h-3 animate-pulse rounded" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
          ) : (
            getUserRole()
          )}
        </p>
        {profileError && <p className="text-xs text-red-400 truncate">{profileError}</p>}
      </div>
    </div>
  );

  // Filter navItems based on user permissions
  const filteredNavItems = navItems.filter(item =>
    item.permission ? userPermissions.includes(item.permission) : true
  );

  console.log('Sidebar render - Current user data:', {
    user,
    userDetails,
    displayName: getUserDisplayName(),
    email: getUserEmail(),
    role: getUserRole(),
    profileLoading,
    isLoadingUserDetails,
    profileError
  });

  return (
    <aside
      className={`fixed z-40 flex flex-col min-h-screen top-0 shadow-lg transition-width duration-300 ease-in-out ${className} ${sidebarOpen ? 'w-64' : 'w-20'}`}
      style={{ backgroundColor: 'var(--sidebar-bg)', color: 'white' }}
    >
      {/* --- Header / Profile Section --- */}
      <div
        className={`flex items-center p-4 border-b ${sidebarOpen ? 'justify-between' : 'justify-center'}`}
        style={{ borderColor: 'var(--sidebar-bg-hover)' }}
      >
        {sidebarOpen && <ProfileSection />}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
          className="p-3 rounded-lg text-white hover:bg-[var(--sidebar-bg-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        >
          {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* --- Navigation Links --- */}
      <nav
        className={`flex-1 flex flex-col overflow-y-auto py-4 space-y-2 ${sidebarOpen ? 'px-2' : 'items-center'}`}
      >
        {filteredNavItems.length === 0 ? (
          <p className="text-center text-sm text-gray-400">No accessible pages</p>
        ) : (
          filteredNavItems.map(({ name, icon: Icon, href, description, permission }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={name}
                href={href}
                className={`group relative flex items-center rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-[var(--sidebar-bg-hover)] text-white'
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-bg-hover)] hover:text-white'
                } ${!sidebarOpen ? 'w-12 h-12 justify-center p-3' : 'p-3'}`}
              >
                <Icon className="w-6 h-6" />
                {sidebarOpen ? (
                  <div className="ml-3">
                    <span className="text-sm font-medium">{name}</span>
                    <p className="text-xs opacity-80">{description}</p>
                  </div>
                ) : (
                  <span className="absolute left-full ml-4 px-2 py-1 text-sm font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                    {name}
                  </span>
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* --- Collapsed Profile Section --- */}
      {!sidebarOpen && (
        <div className="p-4 border-t border-[var(--sidebar-bg-hover)]">
          <div className="flex justify-center">
            <div className="relative group">
              <img
                src={getUserAvatar()}
                alt="User avatar"
                className="w-10 h-10 rounded-full object-cover border-2"
                style={{ borderColor: 'var(--primary-color)' }}
                onError={(e) => {
                  e.currentTarget.src = '/file.svg';
                }}
              />
              <div className="absolute left-full ml-4 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                <div className="font-semibold">{getUserDisplayName()}</div>
                <div className="text-xs opacity-80">{getUserEmail()}</div>
                <div className="text-xs opacity-60">{getUserRole()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
