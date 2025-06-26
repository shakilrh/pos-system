import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  Bars3Icon,
  XMarkIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Fallback component for icons
const FallbackIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Active User Icon component
const ActiveUserIcon = () => (
  <svg className="w-3 h-3 text-green-500 ml-1" fill="currentColor" viewBox="0 0 12 12">
    <circle cx="6" cy="6" r="5" />
  </svg>
);

const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/dashboard', description: 'Overview of your account' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement', description: 'Manage your menu items' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders/orders', description: 'View and manage orders' },
  { name: 'Create Orders', icon: PlusCircleIcon || FallbackIcon, href: '/Orders/createOrder', description: 'Create new orders' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement', description: 'Control user roles' },
];

interface SidebarProps {
  className: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ className, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profileLoading, profileError } = useAuth(); // Removed refreshUserProfile
  const [theme, setTheme] = useState('default');
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'default';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleThemeChange = (e: CustomEvent) => {
      const { theme: newTheme } = e.detail;
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, []);

  useEffect(() => {
    // Removed refreshUserProfile call
    const timer = setTimeout(() => {
      if (profileLoading) {
        setLoadingTimeout(true);
      }
    }, 15000); // 15 seconds
    return () => clearTimeout(timer);
  }, [profileLoading]); // Updated dependency

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className={`fixed z-40 flex flex-col min-h top-16 bottom-0 shadow-16 transition-all duration-300 ease-in-out ${className} ${
        sidebarOpen ? 'w-64' : 'w-16'
      } bg-sidebar-bg text-white overflow-y-auto`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {sidebarOpen && (
          <div className="text-left flex items-center">
            {(profileLoading && !loadingTimeout) ? (
              <div className="w-8 h-8 mr-2 rounded-full bg-gray-600 animate-pulse" />
            ) : profileError || loadingTimeout ? (
              <img
                src="/fallback-avatar.png"
                alt="Default avatar"
                className="w-8 h-8 mr-2 rounded-full object-cover border-2 border-primary-color"
              />
            ) : user?.logoUrl ? (
              <img
                src={user.logoUrl}
                alt={`${user.name || 'User'}'s logo`}
                className="w-8 h-8 mr-2 rounded-full object-cover border-2 border-primary-color"
                onError={(e) => {
                  e.currentTarget.src = '/fallback-avatar.png';
                }}
              />
            ) : (
              <img
                src="/fallback-avatar.png"
                alt="Default avatar"
                className="w-8 h-8 mr-2 rounded-full object-cover border-2 border-primary-color"
              />
            )}
            <div>
              <span className="text-2xl font-bold truncate flex items-center">
                {(profileLoading && !loadingTimeout) ? (
                  <div className="w-20 h-6 bg-gray-600 animate-pulse rounded" />
                ) : profileError || loadingTimeout ? (
                  <>
                    User <ActiveUserIcon />
                  </>
                ) : (
                  <>
                    {user?.name || 'User'} <ActiveUserIcon />
                  </>
                )}
              </span>
              {profileError && !profileLoading && (
                <p className="text-sm text-red-400">{profileError}</p>
              )}
              <p className="text-sm text-gray-400">Welcome to Your Dashboard</p>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="focus:outline-none hover:bg-sidebar-bg-hover">
          {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        <nav className="space-y-2">
          {navItems.map(({ name, icon: Icon, href, description }) => (
            <Link
              key={name}
              href={href}
              onClick={() => navigate(href)}
              className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                pathname === href
                  ? 'bg-sidebar-bg-hover text-white'
                  : 'text-gray-200 hover:bg-sidebar-bg-hover hover:text-white'
              }`}
            >
              <Icon className="w-6 h-6" />
              {sidebarOpen && (
                <div className="ml-3">
                  <span className="text-sm font-medium">{name}</span>
                  <p className="text-xs text-gray-400">{description}</p>
                </div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
