import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';
import UsersTemplate from './UsersTemplate';
import RolesTemplate from './RolesTemplate';
import PermissionsTemplate from './PermissionsTemplate';

export default function RoleAndUserManagement() {
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Users');
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/login');
    }
  }, [isClient, isAuthenticated, router]);

  if (!isClient || !isAuthenticated) {
    return null;
  }

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 font-sans ${darkMode ? 'dark' : ''}`}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-lg p-3 flex justify-between items-center sticky top-0 z-20 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <button
              className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" /> : <Bars3Icon className="w-5 h-5 text-gray-700 dark:text-gray-200" />}
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Role & User Management</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
            <button
              className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Notifications"
            >
              <BellIcon className="w-4 h-4" />
            </button>
            <button
              className="p-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={logout}
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <img
                src="https://via.placeholder.com/40"
                alt="User profile"
                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 object-cover"
              />
              <span className="text-xs font-medium text-gray-800 dark:text-gray-100 hidden sm:block">Admin User</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5 bg-gray-100 dark:bg-gray-900">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'Users' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('Users')}
            >
              Users
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'Roles' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('Roles')}
            >
              Roles
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'Permissions' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('Permissions')}
            >
              Permissions
            </button>
          </div>

          {activeTab === 'Users' && (
            <UsersTemplate token={token} logout={logout} />
          )}
          {activeTab === 'Roles' && (
            <RolesTemplate token={token} logout={logout} />
          )}
          {activeTab === 'Permissions' && (
            <PermissionsTemplate token={token} logout={logout} />
          )}
        </main>
      </div>
    </div>
  );
}
