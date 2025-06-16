// src/components/Header.tsx (remote)
import { useState } from 'react';
import { Bars3Icon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';

export default function Header({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="bg-gray-900 text-white p-4 fixed top-0 w-full shadow-lg z-20">
      <div className="flex items-center justify-between">
        {/* Left Side: Branding and Mobile Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-300 hover:text-white" onClick={onSidebarToggle}>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-indigo-400 text-xl">🍽️</span>
            <span className="text-lg font-semibold tracking-tight">Rasant POS</span>
          </div>
        </div>

        {/* Right Side: User Profile and Notifications */}
        <div className="flex items-center gap-4">
          <button className="relative text-gray-300 hover:text-white">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <UserCircleIcon className="w-6 h-6" />
              <span className="hidden md:block text-sm font-medium">Admin User</span>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg">
                <div className="p-2 border-b border-gray-700">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-gray-400">admin@rasant.com</p>
                </div>
                <a
                  href="/profile"
                  className="block px-4 py-2 text-sm hover:bg-gray-700"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Profile
                </a>
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm hover:bg-gray-700"
                  onClick={() => setIsProfileOpen(false)}
                >
                  Settings
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
