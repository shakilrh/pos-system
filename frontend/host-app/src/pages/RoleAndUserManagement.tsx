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
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  useEffect(() => {
    setIsClient(true);
    const theme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
    setCurrentTheme(theme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
          setCurrentTheme(newTheme);
        }
      });
    });

    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      observer.observe(htmlElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/login');
    }
  }, [isClient, isAuthenticated, router]);

  if (!isClient || !isAuthenticated) {
    return null;
  }

  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937',
        cardBorder: '#374151',
        cardText: '#ffffff',
        headingText: '#ffffff',
        inactiveTabText: '#d1d5db',
        hoverTabText: '#ffffff'
      };
    }

    switch (currentTheme) {
      case 'blue':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#1e3a8a',
          headingText: '#1e3a8a',
          inactiveTabText: '#6b7280',
          hoverTabText: '#1e3a8a'
        };
      case 'green':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
          inactiveTabText: '#6b7280',
          hoverTabText: '#064e3b'
        };
      default:
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#111827',
          headingText: '#111827',
          inactiveTabText: '#6b7280',
          hoverTabText: '#111827'
        };
    }
  };

  const themeColors = getThemeColors();

  return (
    <div className="w-full min-h-screen bg-[var(--background-color)]">
      <div
        className="rounded-lg shadow-md border w-full mt-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.cardBorder,
          color: themeColors.cardText,
        }}
      >
        <div className="p-8">
          <h1 className="text-2xl font-semibold mb-8" style={{ color: themeColors.headingText }}>
            Role & User Management
          </h1>
          <div
            className="border-b mb-6 w-full"
            style={{
              borderColor: themeColors.cardBorder,
            }}
          >
            <nav className="flex space-x-6" aria-label="Tabs">
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
                        : themeColors.inactiveTabText,
                    background: 'none',
                  }}
                  className="
                    py-3 px-4 text-sm font-medium border-b-2
                    focus:outline-none transition-colors duration-150
                  "
                  onMouseEnter={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.color = themeColors.hoverTabText;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab) {
                      e.currentTarget.style.color = themeColors.inactiveTabText;
                    }
                  }}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div>
            {activeTab === 'Users' && <UsersTemplate token={token} logout={logout} />}
            {activeTab === 'Roles' && <RolesTemplate token={token} logout={logout} />}
            {activeTab === 'Permissions' && <PermissionsTemplate token={token} logout={logout} />}
          </div>
        </div>
      </div>
    </div>
  );
}
