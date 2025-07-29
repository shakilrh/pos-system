import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const [language, setLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownThemeRef = useRef<string>('default');

  const API_BASE_URL = 'http://192.168.18.107:3000';
  const API_ENDPOINT = '/users/api/v1/admin-profile';
  const USER_DETAILS_ENDPOINT = '/users/api/v1/details'; // Added for getting user details

  useEffect(() => {
    // Check authentication status
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/pos-system/login';
      return;
    }

    // Load initial settings
    loadUserProfile();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    // Start polling for theme changes every 2 seconds
    if (token && isAuthenticated) {
      startThemePolling();
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, isLoading, token]);

  // Polling function to check for theme changes
  const startThemePolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      await checkForThemeUpdates();
    }, 2000); // Poll every 2 seconds
  };

  const checkForThemeUpdates = async () => {
    if (!token || isUpdatingTheme) return; // Don't poll while updating

    try {
      // Use the details endpoint to get current theme
      const response = await fetch(`${API_BASE_URL}${USER_DETAILS_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          window.location.href = '/pos-system/login';
          return;
        }
        return; // Silently fail for polling
      }

      const data = await response.json();
      if (!data.success) return;

      // Extract theme from the correct path in the API response
      const serverTheme = data.data?.data?.user?.theme || 'default';

      // Only update if theme actually changed and it's different from what we expect
      if (serverTheme !== lastKnownThemeRef.current && serverTheme !== theme) {
        console.log(`Theme changed externally from ${lastKnownThemeRef.current} to ${serverTheme}`);
        setTheme(serverTheme);
        applyThemeToDOM(serverTheme);
        lastKnownThemeRef.current = serverTheme;

        // Show notification about theme change
        showThemeChangeNotification(serverTheme);
      }
    } catch (error) {
      // Silently fail for polling - don't show errors
      console.log('Polling error (ignored):', error);
    }
  };

  const showThemeChangeNotification = (themeName: string) => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = `Theme changed to ${themeName}`;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const loadUserProfile = async () => {
    if (!token) {
      const savedTheme = localStorage.getItem('appTheme') || 'default';
      setTheme(savedTheme);
      applyThemeToDOM(savedTheme);
      lastKnownThemeRef.current = savedTheme;
      return;
    }

    try {
      // Use the details endpoint to get current user profile including theme
      const response = await fetch(`${API_BASE_URL}${USER_DETAILS_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          window.location.href = '/pos-system/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Extract theme from the correct path in the API response
      const userTheme = data.data?.data?.user?.theme || 'default';
      console.log('Loaded user theme from API:', userTheme);

      setTheme(userTheme);
      applyThemeToDOM(userTheme);
      lastKnownThemeRef.current = userTheme;
      setError(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      const savedTheme = localStorage.getItem('appTheme') || 'default';
      setTheme(savedTheme);
      applyThemeToDOM(savedTheme);
      lastKnownThemeRef.current = savedTheme;
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    }
  };

  const applyThemeToDOM = (selectedTheme: string) => {
    console.log('Applying theme to DOM:', selectedTheme);

    // Remove any existing theme classes
    document.documentElement.classList.remove(
      'theme-default', 'theme-blue', 'theme-green',
      'theme-professional', 'theme-warm-minimal', 'theme-dark-pro'
    );

    // Add new theme class
    document.documentElement.classList.add(`theme-${selectedTheme}`);

    // Set data attribute for CSS variables
    document.documentElement.setAttribute('data-theme', selectedTheme);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeChange', {
      detail: { theme: selectedTheme }
    }));

    // Save to localStorage
    localStorage.setItem('appTheme', selectedTheme);

    // Force a repaint to ensure theme changes are immediately visible
    document.documentElement.style.display = 'none';
    document.documentElement.offsetHeight; // Trigger reflow
    document.documentElement.style.display = '';
  };

  const saveThemeToAPI = async (selectedTheme: string) => {
    if (!token) {
      applyThemeToDOM(selectedTheme);
      return false;
    }

    try {
      setIsUpdatingTheme(true);
      setError(null);

      // Temporarily stop polling while updating
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ theme: selectedTheme }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          window.location.href = '/pos-system/login';
          return false;
        }

        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If can't parse JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Theme update response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to update theme');
      }

      // Update our reference to the new theme
      lastKnownThemeRef.current = selectedTheme;
      applyThemeToDOM(selectedTheme);
      console.log('Theme updated successfully to:', selectedTheme);

      // Restart polling after successful update
      setTimeout(() => {
        if (token && isAuthenticated) {
          startThemePolling();
        }
      }, 1000);

      return true;

    } catch (error) {
      console.error('Error updating theme:', error);
      setError(error instanceof Error ? error.message : 'Failed to update theme');

      // Still apply theme locally even if API fails
      applyThemeToDOM(selectedTheme);

      // Restart polling even after error
      setTimeout(() => {
        if (token && isAuthenticated) {
          startThemePolling();
        }
      }, 1000);

      return false;
    } finally {
      setIsUpdatingTheme(false);
    }
  };

  const handleThemeChange = async (selectedTheme: string) => {
    console.log('Changing theme to:', selectedTheme);

    // Update state immediately for better UX
    setTheme(selectedTheme);

    // Apply theme to DOM immediately
    applyThemeToDOM(selectedTheme);

    // Update our reference
    lastKnownThemeRef.current = selectedTheme;

    // Save to API in background
    const success = await saveThemeToAPI(selectedTheme);

    if (success) {
      console.log('Theme saved successfully');
    } else {
      console.log('Theme applied locally but API save failed');
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-color)]"></div>
      </div>
    );
  }

  if (error && !theme) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--error-color)]">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your experience</p>
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Language Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Language</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred language</p>
              </div>
              <div className="text-2xl">🌐</div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="English">English</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="German">Deutsch</option>
            </select>
          </div>

          {/* Theme Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select your color theme
                  {isUpdatingTheme && <span className="ml-2 text-xs text-blue-500">Saving...</span>}
                  {!isUpdatingTheme && theme && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      Current: {theme} • Auto-sync enabled
                    </span>
                  )}
                </p>
              </div>
              <div className="text-2xl">🎨</div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { value: 'default', label: 'Default', color: 'bg-orange-500', border: 'border-orange-200' },
                { value: 'blue', label: 'Blue', color: 'bg-blue-500', border: 'border-blue-200' },
                { value: 'green', label: 'Green', color: 'bg-emerald-600', border: 'border-emerald-200' },
                { value: 'professional', label: 'Professional', color: 'bg-gray-900', border: 'border-gray-400' },
                { value: 'warm-minimal', label: 'Warm Minimal', color: 'bg-orange-900', border: 'border-orange-300' },
                { value: 'dark-pro', label: 'Dark Pro', color: 'bg-gray-800', border: 'border-gray-500' },
              ].map((themeOption) => {
                const isActive = theme === themeOption.value;
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => handleThemeChange(themeOption.value)}
                    disabled={isUpdatingTheme}
                    className={`group relative flex flex-col items-center justify-center w-28 h-20 rounded-xl border bg-white dark:bg-gray-900 shadow-sm transition-all duration-150
                      ${isActive ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-gray-200 dark:border-gray-700 hover:border-primary/60 hover:shadow-md'}
                      ${isUpdatingTheme ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary/60'}`}
                    style={isActive ? { boxShadow: '0 2px 12px 0 var(--primary-color, #f97316, 0.08)' } : {}}
                    aria-label={`Select ${themeOption.label} theme`}
                  >
                    <span className={`w-7 h-7 rounded-full mb-2 border-2 ${themeOption.color} ${themeOption.border} shadow-sm`} />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{themeOption.label}</span>
                    {isActive && <span className="absolute top-2 right-2 text-primary text-base font-bold">✓</span>}
                    {isUpdatingTheme && isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
