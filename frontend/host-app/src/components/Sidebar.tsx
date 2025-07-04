import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

// --- Navigation Structure ---
const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/Dashboard/dashboard', description: 'Overview of your account', permission: 'Dashboard_access' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement', description: 'Manage your menu items', permission: 'Menu_access' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders/orders', description: 'View and manage orders', permission: 'Orders_access' },
  { name: 'Create Orders', icon: PlusCircleIcon || FallbackIcon, href: '/Orders/createOrder', description: 'Create new orders', permission: 'Orders_can_create' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement', description: 'Control user roles', permission: 'Roles_access' },
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
  const { user, profileLoading, profileError } = useAuth();
  const [theme, setTheme] = useState('default');

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

  const ProfileSection = () => (
    <div className="flex items-center">
      {profileLoading ? (
        <div className="w-10 h-10 mr-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
      ) : (
        <img
          src={user?.logoUrl || '/fallback-avatar.png'}
          alt="User avatar"
          className="w-10 h-10 mr-3 rounded-full object-cover border-2"
          style={{ borderColor: 'var(--primary-color)' }}
          onError={(e) => { e.currentTarget.src = '/fallback-avatar.png'; }}
        />
      )}
      <div className="overflow-hidden">
        <span className="text-xl font-bold truncate flex items-center text-white">
          {profileLoading ? (
            <div className="w-24 h-6 animate-pulse rounded" style={{ backgroundColor: 'var(--sidebar-bg-hover)' }} />
          ) : (
            <>
              {user?.name || 'User'} <ActiveUserIcon />
            </>
          )}
        </span>
        <p className="text-sm" style={{ color: 'var(--sidebar-text)' }}>Welcome Back</p>
        {profileError && <p className="text-xs text-red-400">{profileError}</p>}
      </div>
    </div>
  );

  // Filter navItems based on user permissions
  const filteredNavItems = navItems.filter(item =>
    item.permission ? userPermissions.includes(item.permission) : true
  );

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
    </aside>
  );
}
