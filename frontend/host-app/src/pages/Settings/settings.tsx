import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCog,
  faCoins,
  faMoneyBillWave,
  faPalette,
  faPaintBrush,
  faRupeeSign,
  faDollarSign,
  faEuroSign,
  faSun,
  faWater,
  faLeaf,
  faBriefcase,
  faFire,
  faMoon,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faStore
} from '@fortawesome/free-solid-svg-icons';

export default function Settings() {
  const { isAuthenticated, isLoading, token, logout, user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [currency, setCurrency] = useState('pkr');
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();
  const { restaurantSlug } = useAuth();
  const [showThemeConfirmation, setShowThemeConfirmation] = useState(false);
  const [showCurrencyConfirmation, setShowCurrencyConfirmation] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownThemeRef = useRef<string>('default');
  const lastKnownCurrencyRef = useRef<string>('pkr');

  const API_BASE_URL = 'http://192.168.18.37:3000';
  const ADMIN_PROFILE_ENDPOINT = '/users/api/v1/admin-profile';
  const USER_PROFILE_ENDPOINT = '/users/api/v1/profile';
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
      const serverUserId = data.data?.data?.user?.id || data.data?.data?.user?._id || '';

      if (serverUserId !== userId) {
        setUserId(serverUserId);
      }

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
    notification.innerHTML = `<span class="mr-2">🎨</span>Theme changed to ${themeName}`;
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
    notification.innerHTML = `<span class="mr-2">💰</span>Currency changed to ${currencyName}`;
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
      const userId = data.data?.data?.user?.id || data.data?.data?.user?._id || '';
      console.log('Loaded user settings from API:', { theme: userTheme, currency: userCurrency, userId });

      setTheme(userTheme);
      setCurrency(userCurrency);
      setUserId(userId);
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

  const getApiEndpoint = () => {
    return user?.user_type === 'isadmin'
        ? `${API_BASE_URL}${ADMIN_PROFILE_ENDPOINT}`
        : `${API_BASE_URL}${USER_PROFILE_ENDPOINT}`;
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

      const payload: Record<string, any> = { ...settings };
      if (user?.user_type === 'worker' && userId) {
        payload._id = userId;
      }

      const response = await fetch(getApiEndpoint(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  const requestThemeChange = (selectedTheme: string) => {
    if (selectedTheme === theme) return;
    setPendingTheme(selectedTheme);
    setShowThemeConfirmation(true);
  };

  const confirmThemeChange = async () => {
    if (!pendingTheme) return;

    console.log('Changing theme to:', pendingTheme);
    setTheme(pendingTheme);
    applyThemeToDOM(pendingTheme);
    lastKnownThemeRef.current = pendingTheme;

    const success = await saveSettingsToAPI({ theme: pendingTheme });
    if (success) {
      console.log('Theme saved successfully');
    } else {
      console.log('Theme applied locally but API save failed');
    }

    setShowThemeConfirmation(false);
    setPendingTheme(null);
  };

  const cancelThemeChange = () => {
    setShowThemeConfirmation(false);
    setPendingTheme(null);
  };

  const requestCurrencyChange = (selectedCurrency: string) => {
    if (selectedCurrency === currency) return;
    setPendingCurrency(selectedCurrency);
    setShowCurrencyConfirmation(true);
  };

  const confirmCurrencyChange = async () => {
    if (!pendingCurrency) return;

    console.log('Changing currency to:', pendingCurrency);
    setCurrency(pendingCurrency);
    applyCurrencyToDOM(pendingCurrency);
    lastKnownCurrencyRef.current = pendingCurrency;

    const success = await saveSettingsToAPI({ currency: pendingCurrency });
    if (success) {
      console.log('Currency saved successfully');
    } else {
      console.log('Currency applied locally but API save failed');
    }

    setShowCurrencyConfirmation(false);
    setPendingCurrency(null);
  };

  const cancelCurrencyChange = () => {
    setShowCurrencyConfirmation(false);
    setPendingCurrency(null);
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const isAdmin = user?.user_type === 'isadmin';

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
            <h1 className="text-3xl font-bold text-[var(--text-color)] mb-2 flex items-center">
              <FontAwesomeIcon icon={faCog} className="mr-3 text-[var(--primary-color)]" />
              Settings
            </h1>
            <p className="text-[var(--text-secondary)]">Customize your experience</p>
            {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    <strong>
                      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                      Error:
                    </strong> {error}
                  </p>
                </div>
            )}
          </div>

          <div className="space-y-6">
            {isAdmin && (
                <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                        <FontAwesomeIcon icon={faCoins} className="mr-2 text-[var(--primary-color)]" />
                        Currency
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Select your preferred currency
                        {isUpdatingCurrency && (
                            <span className="ml-2 text-xs text-blue-500">
                        <FontAwesomeIcon icon={faSpinner} spin className="mr-1" />
                        Saving...
                      </span>
                        )}
                        {!isUpdatingCurrency && currency && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                        Current: {currency.toUpperCase()} • Auto-sync enabled
                      </span>
                        )}
                      </p>
                    </div>
                    <div className="text-2xl">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-[var(--primary-color)]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { value: 'pkr', label: 'Pakistani Rupee', symbol: '₨', code: 'PKR', icon: faRupeeSign },
                      { value: 'dollar', label: 'US Dollar', symbol: '$', code: 'USD', icon: faDollarSign },
                      { value: 'euro', label: 'Euro', symbol: '€', code: 'EUR', icon: faEuroSign },
                    ].map((currencyOption) => {
                      const isActive = currency === currencyOption.value;
                      return (
                          <button
                              key={currencyOption.value}
                              onClick={() => requestCurrencyChange(currencyOption.value)}
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
                                <FontAwesomeIcon icon={currencyOption.icon} className="text-[var(--text-color)]" />
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
                                  <FontAwesomeIcon icon={faSpinner} spin className="text-[var(--primary-color)]" />
                              ) : isActive ? (
                                  <div className="w-4 h-4 rounded-full bg-[var(--primary-color)] flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
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
            )}

            <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                    <FontAwesomeIcon icon={faPalette} className="mr-2 text-[var(--primary-color)]" />
                    Theme
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Select your color theme
                    {isUpdatingTheme && (
                        <span className="ml-2 text-xs text-blue-500">
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-1" />
                      Saving...
                    </span>
                    )}
                    {!isUpdatingTheme && theme && (
                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                      Current: {theme} • Auto-sync enabled
                    </span>
                    )}
                  </p>
                </div>
                <div className="text-2xl">
                  <FontAwesomeIcon icon={faPaintBrush} className="text-[var(--primary-color)]" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'default', label: 'Default', color: 'bg-orange-500', border: 'border-orange-200', icon: faSun },
                  { value: 'blue', label: 'Blue', color: 'bg-blue-500', border: 'border-blue-200', icon: faWater },
                  { value: 'green', label: 'Green', color: 'bg-emerald-600', border: 'border-emerald-200', icon: faLeaf },
                  { value: 'professional', label: 'Professional', color: 'bg-gray-900', border: 'border-gray-400', icon: faBriefcase },
                  { value: 'warm-minimal', label: 'Warm Minimal', color: 'bg-orange-900', border: 'border-orange-300', icon: faFire },
                  { value: 'dark-pro', label: 'Dark Pro', color: 'bg-gray-800', border: 'border-gray-500', icon: faMoon },
                ].map((themeOption) => {
                  const isActive = theme === themeOption.value;
                  return (
                      <button
                          key={themeOption.value}
                          onClick={() => requestThemeChange(themeOption.value)}
                          disabled={isUpdatingTheme}
                          className={`group relative flex flex-col items-center justify-center w-28 h-20 rounded-xl border bg-[var(--surface-color)] shadow-sm transition-all duration-150
                      ${isActive ? 'border-primary ring-2 ring-primary/40 scale-105' : 'border-[var(--border-color)] hover:border-primary/60 hover:shadow-md'}
                      ${isUpdatingTheme ? 'opacity-50 cursor-not-allowed' : 'focus:outline-none focus:ring-2 focus:ring-primary/60'}`}
                          style={isActive ? { boxShadow: '0 2px 12px 0 var(--primary-color, #f97316, 0.08)' } : {}}
                          aria-label={`Select ${themeOption.label} theme`}
                      >
                    <span className={`w-7 h-7 rounded-full mb-1 border-2 ${themeOption.color} ${themeOption.border} shadow-sm flex items-center justify-center`}>
                      <FontAwesomeIcon icon={themeOption.icon} className="text-white text-xs" />
                    </span>
                        <span className="text-xs font-medium text-[var(--text-color)] text-center leading-tight">{themeOption.label}</span>
                        {isActive && <FontAwesomeIcon icon={faCheck} className="absolute top-1 right-1 text-primary text-sm" />}
                        {isUpdatingTheme && isActive && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FontAwesomeIcon icon={faSpinner} spin className="text-primary" />
                            </div>
                        )}
                      </button>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
                <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                        <FontAwesomeIcon icon={faStore} className="mr-2 text-[var(--primary-color)]" />
                        Site Settings
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">Manage store details and carousel images</p>
                    </div>
                  </div>
                  <button
                      onClick={() => {
                        const slug = restaurantSlug || localStorage.getItem('restaurantSlug') || '';
                        const path = slug ? `/${slug}/Settings/site` : '/Settings/site';
                        router.push(path);
                      }}
                      className="w-full px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--primary-color)]/90 transition-colors duration-200 flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faStore} className="mr-2" />
                    Go to Site Settings
                  </button>
                </div>
            )}
          </div>
        </div>

        {showThemeConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--background-secondary)] rounded-xl p-6 max-w-md mx-4 border border-[var(--border-color)] shadow-xl">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon icon={faPalette} className="text-[var(--primary-color)] text-xl mr-3" />
                  <h3 className="text-lg font-semibold text-[var(--text-color)]">Confirm Theme Change</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                  Are you sure you want to change the theme to <strong>{pendingTheme}</strong>?
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                      onClick={cancelThemeChange}
                      className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-1" />
                    Cancel
                  </button>
                  <button
                      onClick={confirmThemeChange}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--primary-color)]/90 transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                    Confirm
                  </button>
                </div>
              </div>
            </div>
        )}

        {showCurrencyConfirmation && isAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--background-secondary)] rounded-xl p-6 max-w-md mx-4 border border-[var(--border-color)] shadow-xl">
                <div className="flex items-center mb-4">
                  <FontAwesomeIcon icon={faCoins} className="text-[var(--primary-color)] text-xl mr-3" />
                  <h3 className="text-lg font-semibold text-[var(--text-color)]">Confirm Currency Change</h3>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                  Are you sure you want to change the currency to <strong>{pendingCurrency?.toUpperCase()}</strong>?
                </p>
                <div className="flex space-x-3 justify-end">
                  <button
                      onClick={cancelCurrencyChange}
                      className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-1" />
                    Cancel
                  </button>
                  <button
                      onClick={confirmCurrencyChange}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--primary-color)]/90 transition-colors duration-200"
                  >
                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                    Confirm
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}