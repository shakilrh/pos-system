import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import UsersTemplate from './UsersTemplate';
import RolesTemplate from './RolesTemplate';
import PermissionsTemplate from './PermissionsTemplate';

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
  );
}

//test
