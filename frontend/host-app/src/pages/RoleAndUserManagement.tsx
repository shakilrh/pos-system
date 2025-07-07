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
    <main
      className="min-h-screen py-6 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div
        className="max-w-6xl mx-auto"
        style={{
          color: 'var(--text-color)',
        }}
      >
        <h1
          className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white"
        >
          Role & User Management
        </h1>

        {/* Tabs */}
        <div
          className="border-b mb-4"
          style={{
            borderColor: 'var(--border-color)',
          }}
        >
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {['Users', 'Roles', 'Permissions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  borderBottomColor:
                    activeTab === tab
                      ? 'var(--primary-color)'
                      : 'transparent',
                  color:
                    activeTab === tab
                      ? 'var(--primary-color)'
                      : 'var(--text-secondary)',
                  background: 'none',
                }}
                className={`
                  py-3 px-4 text-sm font-medium border-b-2
                  focus:outline-none transition-colors duration-150
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div
          className="rounded-lg shadow-md p-4 border"
          style={{
            backgroundColor: 'var(--surface-color)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-color)',
          }}
        >
          {activeTab === 'Users' && <UsersTemplate token={token} logout={logout} />}
          {activeTab === 'Roles' && <RolesTemplate token={token} logout={logout} />}
          {activeTab === 'Permissions' && <PermissionsTemplate token={token} logout={logout} />}
        </div>
      </div>
    </main>
  );
}
