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

// --- Helper Functions ---
const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

const getAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F06292', '#AED581', '#FFB74D',
    '#81C784', '#64B5F6', '#A1887F', '#90A4AE', '#E57373'
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Get display name - show initials if name is too long
const getDisplayName = (fullName: string, maxLength: number = 15): string => {
  if (!fullName || fullName === 'Loading...') return fullName;

  if (fullName.length <= maxLength) {
    return fullName;
  }

  // Return initials if name is too long
  return getInitials(fullName);
};

// Avatar Component with fallback to initials
const Avatar = ({
                  src,
                  name,
                  size = 'md',
                  className = ''
                }: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const shouldShowFallback = !src || imgError || src === '/file.svg';

  useEffect(() => {
    if (src && src !== '/file.svg') {
      setImgError(false);
      setImgLoading(true);
    } else {
      setImgLoading(false);
    }
  }, [src]);

  if (shouldShowFallback) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 ${className}`}
        style={{
          backgroundColor: getAvatarColor(name),
          borderColor: 'var(--primary-color)'
        }}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className="relative">
      {imgLoading && (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 ${className}`}
          style={{
            backgroundColor: getAvatarColor(name),
            borderColor: 'var(--primary-color)'
          }}
        >
          {getInitials(name)}
        </div>
      )}
      <img
        src={src}
        alt={`${name}'s avatar`}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 ${className} ${imgLoading ? 'absolute top-0 left-0' : ''}`}
        style={{ borderColor: 'var(--primary-color)' }}
        onLoad={() => setImgLoading(false)}
        onError={() => {
          setImgError(true);
          setImgLoading(false);
        }}
      />
    </div>
  );
};

// --- Navigation Structure ---
const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/Dashboard/dashboard', description: 'Overview of your account', permission: 'can_view_dashboard' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement', description: 'Manage your menu items', permission: 'can_view_menu' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders/orders', description: 'View and manage orders', permission: 'can_view_orders' },
  { name: 'Create Orders', icon: PlusCircleIcon || FallbackIcon, href: '/Orders/createOrder', description: 'Create new orders', permission: 'create_orders' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement', description: 'Control user roles', permission: 'can_view_rolemanagement' },
  { name: 'Tables Management', icon: Square3Stack3DIcon || FallbackIcon, href: '/Tables/FloorTableManagement', description: 'Control Tables | Floors', permission: 'can_view_tablemanagement' }
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

  // Get user avatar URL with proper fallbacks - only return actual user photos, not store logos
  const getUserAvatar = () => {
    const avatar = userDetails?.logoUrl || user?.logoUrl;
    // Only return if it's a valid user avatar, not default file.svg or store logo
    return (avatar && avatar !== '/file.svg') ? avatar : undefined;
  };

  // Get user role display
  const getUserRole = () => {
    if (isLoadingUserDetails || profileLoading) return 'Loading...';
    const currentUser = userDetails || user;
    if (currentUser?.user_type === 'isadmin') return 'Administrator';
    return currentUser?.user_type || 'User';
  };

  const ProfileSection = () => (
    <div className="flex items-center min-w-0 flex-1">
      {(isLoadingUserDetails || profileLoading) ? (
        <div className="w-10 h-10 mr-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
      ) : (
        <div className="mr-3 flex-shrink-0">
          <Avatar
            src={getUserAvatar()}
            name={getUserDisplayName()}
            size="md"
          />
        </div>
      )}
      <div className="overflow-hidden min-w-0 flex-1">
        <div className="text-lg font-bold flex items-center text-white">
          {(isLoadingUserDetails || profileLoading) ? (
            <div className="w-24 h-5 animate-pulse rounded" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
          ) : (
            <>
              <span className="truncate" title={getUserDisplayName()}>
                {getDisplayName(getUserDisplayName())}
              </span>
              <ActiveUserIcon />
            </>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }} title={getUserEmail()}>
          {(isLoadingUserDetails || profileLoading) ? (
            <div className="w-20 h-3 animate-pulse rounded" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
          ) : (
            getUserEmail()
          )}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)', opacity: 0.8 }} title={getUserRole()}>
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
        className={`flex items-center p-4 border-b min-w-0 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}
        style={{ borderColor: 'var(--sidebar-bg-hover)' }}
      >
        {sidebarOpen && <ProfileSection />}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
          className={`p-3 rounded-lg text-white hover:bg-[var(--sidebar-bg-hover)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white flex-shrink-0 ${sidebarOpen ? 'ml-2' : ''}`}
        >
          {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* --- Navigation Links --- */}
      <nav
        className={`flex-1 flex flex-col py-4 space-y-2 overflow-y-auto overflow-x-hidden ${
          sidebarOpen ? 'px-2' : 'items-center'
        }`}
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
                <Icon className="w-6 h-6 flex-shrink-0" />
                {sidebarOpen ? (
                  <div className="ml-3 min-w-0 flex-1">
                    <span className="text-sm font-medium block truncate">{name}</span>
                    <p className="text-xs opacity-80 truncate">{description}</p>
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
              <Avatar
                src={getUserAvatar()}
                name={getUserDisplayName()}
                size="md"
              />
              <div className="absolute left-full ml-4 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
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
