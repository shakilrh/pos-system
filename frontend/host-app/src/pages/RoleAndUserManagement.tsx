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
    // Get initial theme
    const theme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
    setCurrentTheme(theme);

    // Listen for theme changes
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
    // Handle both dark and dark-pro themes
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937', // Dark gray for any dark theme
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
          cardBackground: '#ffffff', // White for blue theme
          cardBorder: '#e5e7eb',
          cardText: '#1e3a8a',
          headingText: '#1e3a8a',
          inactiveTabText: '#6b7280',
          hoverTabText: '#1e3a8a'
        };
      case 'green':
        return {
          cardBackground: '#ffffff', // White for green theme
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
          inactiveTabText: '#6b7280',
          hoverTabText: '#064e3b'
        };
      default:
        return {
          cardBackground: '#ffffff', // White for default theme
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
    <main
      className="min-h-screen py-6 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      <div
        className="max-w-7xl mx-auto"
        style={{
          color: 'var(--text-color)',
        }}
      >
        {/* Rounded Corner Card with Theme-Aware Colors */}
        <div
          className="rounded-lg shadow-lg border w-full mt-6"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.cardBorder,
            color: themeColors.cardText,
          }}
        >
          <div className="p-8">
            <h1
              className="text-2xl font-semibold mb-8"
              style={{
                color: themeColors.headingText
              }}
            >
              Role & User Management
            </h1>

            {/* Tabs */}
            <div
              className="border-b mb-6 w-full"
              style={{
                borderColor: themeColors.cardBorder,
              }}
            >
              <nav className="-mb-px flex space-x-6 w-full" aria-label="Tabs">
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
                    className={`
                      py-3 px-4 text-sm font-medium border-b-2
                      focus:outline-none transition-colors duration-150
                    `}
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

            {/* Content with increased spacing */}
            <div className="mt-6">
              {activeTab === 'Users' && <UsersTemplate token={token} logout={logout} />}
              {activeTab === 'Roles' && <RolesTemplate token={token} logout={logout} />}
              {activeTab === 'Permissions' && <PermissionsTemplate token={token} logout={logout} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
