import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [currency, setCurrency] = useState('pkr');
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownThemeRef = useRef<string>('default');
  const lastKnownCurrencyRef = useRef<string>('pkr');

  const API_BASE_URL = 'http://192.168.18.107:3000';
  const API_ENDPOINT = '/users/api/v1/admin-profile';
  const USER_DETAILS_ENDPOINT = '/users/api/v1/details';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/pos-system/login';
      return;
    }

    loadUserProfile();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);

    if (token && isAuthenticated) {
      startThemeAndCurrencyPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, isLoading, token]);

  const startThemeAndCurrencyPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      await checkForUpdates();
    }, 2000);
  };

  const checkForUpdates = async () => {
    if (!token || isUpdatingTheme || isUpdatingCurrency) return;

    try {
      const response = await fetch(`${API_BASE_URL}${USER_DETAILS_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          window.location.href = '/pos-system/login';
          return;
        }
        return;
      }

      const data = await response.json();
      if (!data.success) return;

      const serverTheme = data.data?.data?.user?.theme || 'default';
      const serverCurrency = data.data?.data?.user?.currency || 'pkr';

      if (serverTheme !== lastKnownThemeRef.current && serverTheme !== theme) {
        console.log(`Theme changed externally from ${lastKnownThemeRef.current} to ${serverTheme}`);
        setTheme(serverTheme);
        applyThemeToDOM(serverTheme);
        lastKnownThemeRef.current = serverTheme;
        showThemeChangeNotification(serverTheme);
      }

      if (serverCurrency !== lastKnownCurrencyRef.current && serverCurrency !== currency) {
        console.log(`Currency changed externally from ${lastKnownCurrencyRef.current} to ${serverCurrency}`);
        setCurrency(serverCurrency);
        applyCurrencyToDOM(serverCurrency);
        lastKnownCurrencyRef.current = serverCurrency;
        showCurrencyChangeNotification(serverCurrency);
      }
    } catch (error) {
      console.log('Polling error (ignored):', error);
    }
  };

  const showThemeChangeNotification = (themeName: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = `Theme changed to ${themeName}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const showCurrencyChangeNotification = (currencyName: string) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = `Currency changed to ${currencyName}`;
    document.body.appendChild(notification);

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
      const savedCurrency = localStorage.getItem('appCurrency') || 'pkr';
      setTheme(savedTheme);
      setCurrency(savedCurrency);
      applyThemeToDOM(savedTheme);
      applyCurrencyToDOM(savedCurrency);
      lastKnownThemeRef.current = savedTheme;
      lastKnownCurrencyRef.current = savedCurrency;
      return;
    }

    try {
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

      const userTheme = data.data?.data?.user?.theme || 'default';
      const userCurrency = data.data?.data?.user?.currency || 'pkr';
      console.log('Loaded user settings from API:', { theme: userTheme, currency: userCurrency });

      setTheme(userTheme);
      setCurrency(userCurrency);
      applyThemeToDOM(userTheme);
      applyCurrencyToDOM(userCurrency);
      lastKnownThemeRef.current = userTheme;
      lastKnownCurrencyRef.current = userCurrency;
      setError(null);
    } catch (error) {
      console.error('Error loading user profile:', error);
      const savedTheme = localStorage.getItem('appTheme') || 'default';
      const savedCurrency = localStorage.getItem('appCurrency') || 'pkr';
      setTheme(savedTheme);
      setCurrency(savedCurrency);
      applyThemeToDOM(savedTheme);
      applyCurrencyToDOM(savedCurrency);
      lastKnownThemeRef.current = savedTheme;
      lastKnownCurrencyRef.current = savedCurrency;
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    }
  };

  const applyThemeToDOM = (selectedTheme: string) => {
    console.log('Applying theme to DOM:', selectedTheme);
    document.documentElement.classList.remove(
      'theme-default', 'theme-blue', 'theme-green',
      'theme-professional', 'theme-warm-minimal', 'theme-dark-pro'
    );
    document.documentElement.classList.add(`theme-${selectedTheme}`);
    document.documentElement.setAttribute('data-theme', selectedTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: selectedTheme } }));
    localStorage.setItem('appTheme', selectedTheme);
    document.documentElement.style.display = 'none';
    document.documentElement.offsetHeight;
    document.documentElement.style.display = '';
  };

  const applyCurrencyToDOM = (selectedCurrency: string) => {
    console.log('Applying currency to DOM:', selectedCurrency);
    const currencySymbol = {
      pkr: '₨',
      dollar: '$',
      euro: '€'
    }[selectedCurrency] || '₨';
    document.documentElement.setAttribute('data-currency', selectedCurrency);
    document.documentElement.setAttribute('data-currency-symbol', currencySymbol);
    window.dispatchEvent(new CustomEvent('currencyChange', { detail: { currency: selectedCurrency, symbol: currencySymbol } }));
    localStorage.setItem('appCurrency', selectedCurrency);
  };

  const saveSettingsToAPI = async (settings: { theme?: string; currency?: string }) => {
    if (!token) {
      if (settings.theme) applyThemeToDOM(settings.theme);
      if (settings.currency) applyCurrencyToDOM(settings.currency);
      return false;
    }

    try {
      setIsUpdatingTheme(!!settings.theme);
      setIsUpdatingCurrency(!!settings.currency);
      setError(null);

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
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
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Settings update response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to update settings');
      }

      if (settings.theme) {
        lastKnownThemeRef.current = settings.theme;
        applyThemeToDOM(settings.theme);
      }
      if (settings.currency) {
        lastKnownCurrencyRef.current = settings.currency;
        applyCurrencyToDOM(settings.currency);
      }

      setTimeout(() => {
        if (token && isAuthenticated) {
          startThemeAndCurrencyPolling();
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error instanceof Error ? error.message : 'Failed to update settings');
      if (settings.theme) applyThemeToDOM(settings.theme);
      if (settings.currency) applyCurrencyToDOM(settings.currency);
      setTimeout(() => {
        if (token && isAuthenticated) {
          startThemeAndCurrencyPolling();
        }
      }, 1000);
      return false;
    } finally {
      setIsUpdatingTheme(false);
      setIsUpdatingCurrency(false);
    }
  };

  const handleThemeChange = async (selectedTheme: string) => {
    console.log('Changing theme to:', selectedTheme);
    setTheme(selectedTheme);
    applyThemeToDOM(selectedTheme);
    lastKnownThemeRef.current = selectedTheme;
    const success = await saveSettingsToAPI({ theme: selectedTheme });
    if (success) {
      console.log('Theme saved successfully');
    } else {
      console.log('Theme applied locally but API save failed');
    }
  };

  const handleCurrencyChange = async (selectedCurrency: string) => {
    console.log('Changing currency to:', selectedCurrency);
    setCurrency(selectedCurrency);
    applyCurrencyToDOM(selectedCurrency);
    lastKnownCurrencyRef.current = selectedCurrency;
    const success = await saveSettingsToAPI({ currency: selectedCurrency });
    if (success) {
      console.log('Currency saved successfully');
    } else {
      console.log('Currency applied locally but API save failed');
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

  if (error && !theme && !currency) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--error-color)]">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-color)] transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-color)] mb-2">Settings</h1>
          <p className="text-[var(--text-secondary)]">Customize your experience</p>
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-color)]">Currency</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Select your preferred currency
                  {isUpdatingCurrency && <span className="ml-2 text-xs text-blue-500">Saving...</span>}
                  {!isUpdatingCurrency && currency && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      Current: {currency.toUpperCase()} • Auto-sync enabled
                    </span>
                  )}
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>

            <div className="space-y-2">
              {[
                { value: 'pkr', label: 'Pakistani Rupee', symbol: '₨', code: 'PKR' },
                { value: 'dollar', label: 'US Dollar', symbol: '$', code: 'USD' },
                { value: 'euro', label: 'Euro', symbol: '€', code: 'EUR' },
              ].map((currencyOption) => {
                const isActive = currency === currencyOption.value;
                return (
                  <button
                    key={currencyOption.value}
                    onClick={() => handleCurrencyChange(currencyOption.value)}
                    disabled={isUpdatingCurrency}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                      ${isActive
                      ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5 ring-2 ring-[var(--primary-color)]/20'
                      : 'border-[var(--border-color)] bg-[var(--surface-color)] hover:border-[var(--primary-color)]/60 hover:bg-[var(--surface-hover)]'
                    }
                      ${isUpdatingCurrency ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/60'}`}
                    aria-label={`Select ${currencyOption.label}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-color)]">
                        <span className="text-sm font-bold text-[var(--text-color)]">
                          {currencyOption.symbol}
                        </span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-[var(--text-color)] text-sm">
                          {currencyOption.label}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {currencyOption.code} ({currencyOption.symbol})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isUpdatingCurrency && isActive ? (
                        <div className="w-4 h-4 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div>
                      ) : isActive ? (
                        <div className="w-4 h-4 rounded-full bg-[var(--primary-color)] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-[var(--border-color)]"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-color)]">Theme</h3>
                <p className="text-sm text-[var(--text-secondary)]">
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
                    className={`group relative flex flex-col items-center justify-center w-28 h-20 rounded-xl border bg-[var(--surface-color)] shadow-sm transition-all duration-150
                      ${isActive ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-[var(--border-color)] hover:border-primary/60 hover:shadow-md'}
                      ${isUpdatingTheme ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary/60'}`}
                    style={isActive ? { boxShadow: '0 2px 12px 0 var(--primary-color, #f97316, 0.08)' } : {}}
                    aria-label={`Select ${themeOption.label} theme`}
                  >
                    <span className={`w-7 h-7 rounded-full mb-2 border-2 ${themeOption.color} ${themeOption.border} shadow-sm`} />
                    <span className="text-xs font-medium text-[var(--text-color)]">{themeOption.label}</span>
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
