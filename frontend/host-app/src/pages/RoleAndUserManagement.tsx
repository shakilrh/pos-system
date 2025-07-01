import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import UsersTemplate from './Users/usersTemplate';
import RolesTemplate from './Roles/rolesTemplate';
import PermissionsTemplate from './Permissions/permissionsTemplate';

export default function RoleAndUserManagement() {
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('Users');
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/login');
    }
  }, [isClient, isAuthenticated, router]);

  if (!isClient || !isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Role & User Management</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {['Users', 'Roles', 'Permissions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-3 px-4 text-sm font-medium border-b-2
                  ${activeTab === tab
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } focus:outline-none transition-colors duration-150
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
          {activeTab === 'Users' && <UsersTemplate token={token} logout={logout} />}
          {activeTab === 'Roles' && <RolesTemplate token={token} logout={logout} />}
          {activeTab === 'Permissions' && <PermissionsTemplate token={token} logout={logout} />}
        </div>
      </div>
    </main>
  );
}
