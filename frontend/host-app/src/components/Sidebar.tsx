import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const FallbackIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const navItems = [
  { name: 'Dashboard', icon: HomeIcon || FallbackIcon, href: '/dashboard' },
  { name: 'Menu Management', icon: ShoppingBagIcon || FallbackIcon, href: '/MenuManagement' },
  { name: 'Orders', icon: ChartBarIcon || FallbackIcon, href: '/Orders' },
  { name: 'Roles Management', icon: UsersIcon || FallbackIcon, href: '/RoleAndUserManagement' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      logout();
      onToggle(false);
      await router.push('/login');
    } catch (error) {
      console.error('Error during logout redirect:', error);
      window.location.href = '/login';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex flex-col shadow-2xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6 text-2xl font-bold border-b border-gray-700 flex items-center gap-3">
          <span className="text-yellow-400">🍽️</span>
          <span className="tracking-tight">Restaurant Admin</span>
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-4">
          {navItems.map(({ name, icon: Icon, href }) => (
            <a
              key={name}
              href={href}
              className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                pathname === href
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'text-gray-200 hover:bg-gray-700 hover:text-white'
              }`}
              onClick={() => onToggle(false)}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">{name}</span>
            </a>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-gray-200 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => onToggle(false)}
        />
      )}
    </>
  );
}
