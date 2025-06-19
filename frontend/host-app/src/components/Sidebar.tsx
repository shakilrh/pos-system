import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

// Fallback component for icons
const FallbackIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Define navigation items statically within Sidebar
const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/dashboard' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement' },
];

export default function Sidebar({ className, setSidebarOpen, sidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

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

  return (
    <>
      <aside
        className={`fixed z-40 flex flex-col min-h-0 top-16 bottom-0 shadow-2xl transition-all duration-300 ease-in-out ${className} ${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-gradient-to-b from-gray-800 to-gray-900 text-white overflow-y-auto`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            {sidebarOpen && (
              <>
                <span className="text-yellow-400">🍽️</span>
                <span className="text-xl font-bold tracking-tight">Restaurant Admin</span>
              </>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="focus:outline-none">
            {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map(({ name, icon: Icon, href }) => (
              <a
                key={name}
                href={href}
                className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                  pathname === href
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => sidebarOpen && setSidebarOpen(false)}
              >
                <Icon className="w-6 h-6" />
                {sidebarOpen && <span className="ml-3 text-sm font-medium">{name}</span>}
              </a>
            ))}
          </nav>
        </div>
        <div className="p-6 mt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            {sidebarOpen && <span className="ml-3 text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-20 left-4 p-2 bg-gray-800 text-white rounded-full shadow-lg z-50"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
