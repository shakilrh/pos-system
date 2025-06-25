import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  UserIcon,
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

// Person Icon component
const PersonIcon = () => (
  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/dashboard', description: 'Overview of your account' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement', description: 'Manage your menu items' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders/orders', description: 'View and manage orders' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement', description: 'Control user roles' },
  { name: 'Profile', icon: UserIcon || FallbackIcon, href: '/profile', description: 'View and edit your profile' },
  { name: 'Settings', icon: CogIcon || FallbackIcon, href: '/settings', description: 'Configure application settings' },
  { name: 'Logout', icon: ArrowRightOnRectangleIcon || FallbackIcon, href: '/login', description: 'Sign out of your account' },
];

interface SidebarProps {
  className: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ className, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [theme, setTheme] = useState('default');

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

  const handleLogout = async () => {
    try {
      await logout();
      setSidebarOpen(false);
      await router.push('/login');
    } catch (error) {
      console.error('Error during logout redirect:', error);
      window.location.href = '/login';
    }
  };

  const navigate = (path: string) => {
    router.push(path);
    // setSidebarOpen(false);
  };

  return (
    <aside
      className={`fixed z-40 flex flex-col min-h top-16 bottom-0 shadow-16 transition-all duration-300 ease-in-out ${className} ${
        sidebarOpen ? 'w-64' : 'w-16'
      } bg-gradient-to-b from-gray-800 to-gray-900 text-white overflow-y-auto`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {sidebarOpen && (
          <div className="text-left">
            <span className="text-2xl font-bold truncate flex items-center">
              <PersonIcon /> {user?.name || 'User'} <ActiveUserIcon />
            </span>
            <p className="text-sm text-gray-400">Welcome to Your Dashboard</p>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="focus:outline-none">
          {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        <nav className="space-y-2">
          {navItems.map(({ name, icon: Icon, href, description }, index) => (
            <Link
              key={name}
              href={href}
              onClick={(e) => {
                if (name === 'Logout') {
                  e.preventDefault();
                  handleLogout();
                } else {
                  navigate(href);
                }
              }}
              className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                pathname === href || (name === 'Logout' && pathname === '/login')
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-200 hover:bg-gray-700 hover:text-white'
              } ${index < 6 ? '' : 'mt-8'}`}
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