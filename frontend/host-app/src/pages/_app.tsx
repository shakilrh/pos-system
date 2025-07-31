import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useRef } from 'react';
import { AppProps } from 'next/app';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import 'shared-tailwind/styles';
import '@fontsource/nunito';

const FallbackHeader = () => <div>Header failed to load</div>;
const FallbackFooter = () => <div>Footer failed to load</div>;

const Header = dynamic(
  () => import('remoteApp/Header').catch((err) => {
    console.error('Header load error:', err);
    return () => FallbackHeader;
  }),
  { ssr: false }
);

import Sidebar from '../components/Sidebar';

const Footer = dynamic(
  () => import('remoteApp/Footer').catch((err) => {
    console.error('Footer load error:', err);
    return () => FallbackFooter;
  }),
  { ssr: false }
);

const publicRoutes = ['/Registration/login', '/Registration/forgotPassword', '/Registration/registerAdmin', '/NoAccess'];

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentCurrency, setCurrentCurrency] = useState('pkr');
  const [themeLoaded, setThemeLoaded] = useState(false);

  const themePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownThemeRef = useRef<string>('default');
  const lastKnownCurrencyRef = useRef<string>('pkr');

  const { isAuthenticated, isLoading, logout, token, user, allPermissions, userPermissions, permissionsLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const API_BASE_URL = 'http://192.168.18.107:3000';
  const USER_DETAILS_ENDPOINT = '/users/api/v1/details';

  const routePermissions = useMemo(() => {
    const mapping: { [key: string]: string } = {};
    if (allPermissions.includes('can_view_dashboard')) mapping['/Dashboard/dashboard'] = 'can_view_dashboard';
    if (allPermissions.includes('can_view_menu')) mapping['/MenuManagement'] = 'can_view_menu';
    if (allPermissions.includes('can_view_orders')) mapping['/Orders/orders'] = 'can_view_orders';
    if (allPermissions.includes('create_orders')) mapping['/Orders/createOrder'] = 'create_orders';
    if (allPermissions.includes('can_view_rolemanagement')) mapping['/RoleAndUserManagement'] = 'can_view_rolemanagement';
    if (allPermissions.includes('can_view_tablemanagement')) mapping['/Tables/FloorTableManagement'] = 'can_view_tablemanagement';
    if (allPermissions.includes('can_view_storesettings')) mapping['/Settings/storeSettings'] = 'can_view_storesettings';
    return mapping;
  }, [allPermissions]);

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
    document.documentElement.style.setProperty('--current-currency', selectedCurrency);
    document.documentElement.style.setProperty('--current-currency-symbol', currencySymbol);
    console.log('Currency applied successfully:', { selectedCurrency, currencySymbol });
  };

  const loadUserSettings = async () => {
    if (!token) {
      const savedTheme = localStorage.getItem('appTheme') || 'default';
      const savedCurrency = localStorage.getItem('appCurrency') || 'pkr';
      console.log('No token, using saved settings:', { theme: savedTheme, currency: savedCurrency });
      setCurrentTheme(savedTheme);
      setCurrentCurrency(savedCurrency);
      applyThemeToDOM(savedTheme);
      applyCurrencyToDOM(savedCurrency);
      lastKnownThemeRef.current = savedTheme;
      lastKnownCurrencyRef.current = savedCurrency;
      setThemeLoaded(true);
      return;
    }

    try {
      console.log('Fetching user settings from API...');
      const response = await fetch(`${API_BASE_URL}${USER_DETAILS_ENDPOINT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired, logging out');
          logout();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch user details');
      }

      const userTheme = data.data?.data?.user?.theme || 'default';
      const userCurrency = data.data?.data?.user?.currency || 'pkr';
      console.log('Loaded user settings from API:', { theme: userTheme, currency: userCurrency });

      setCurrentTheme(userTheme);
      setCurrentCurrency(userCurrency);
      applyThemeToDOM(userTheme);
      applyCurrencyToDOM(userCurrency);
      lastKnownThemeRef.current = userTheme;
      lastKnownCurrencyRef.current = userCurrency;
      setThemeLoaded(true);

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('settingsLoaded', {
          detail: { theme: userTheme, currency: userCurrency }
        }));
      }, 100);
    } catch (error) {
      console.error('Error loading user settings:', error);
      const savedTheme = localStorage.getItem('appTheme') || 'default';
      const savedCurrency = localStorage.getItem('appCurrency') || 'pkr';
      console.log('API failed, using saved settings:', { theme: savedTheme, currency: savedCurrency });
      setCurrentTheme(savedTheme);
      setCurrentCurrency(savedCurrency);
      applyThemeToDOM(savedTheme);
      applyCurrencyToDOM(savedCurrency);
      lastKnownThemeRef.current = savedTheme;
      lastKnownCurrencyRef.current = savedCurrency;
      setThemeLoaded(true);
    }
  };

  const handleSettingsChange = () => {
    console.log('Settings changed, reloading user settings...');
    loadUserSettings();
  };

  const showThemeChangeNotification = (themeName: string) => {
    const existingNotifications = document.querySelectorAll('.theme-change-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'theme-change-notification fixed top-6 right-6 z-[9999] transform translate-x-full opacity-0 transition-all duration-500 ease-out';
    notification.innerHTML = `
      <div class="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden min-w-[320px] max-w-[400px]">
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse"></div>
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400"></div>
        <div class="relative p-4 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"></path>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/90 mb-1">Theme Updated</div>
            <div className="text-lg font-bold text-white capitalize">${themeName} Theme Active</div>
            <div className="text-xs text-white/70 mt-1">Changes synced across devices</div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="progress-bar h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-[4000ms] ease-linear" style="width: 100%"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="particle absolute w-2 h-2 bg-white/30 rounded-full animate-ping" style="top: 20%; left: 10%; animation-delay: 0s;"></div>
          <div className="particle absolute w-1 h-1 bg-white/40 rounded-full animate-ping" style="top: 60%; right: 15%; animation-delay: 0.5s;"></div>
          <div className="particle absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style="bottom: 30%; left: 20%; animation-delay: 1s;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 50);

    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'translateX(0) scale(1.02)';
    });

    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'translateX(0) scale(1)';
    });

    setTimeout(() => {
      const progressBar = notification.querySelector('.progress-bar') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = '0%';
      }
    }, 100);

    setTimeout(() => {
      notification.classList.add('animate-pulse');
      setTimeout(() => {
        notification.style.transform = 'translateX(full) scale(0.8)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 200);
    }, 4000);

    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(full) scale(0.8)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    });
  };

  const showCurrencyChangeNotification = (currencyName: string) => {
    const existingNotifications = document.querySelectorAll('.currency-change-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'currency-change-notification fixed top-6 right-6 z-[9999] transform translate-x-full opacity-0 transition-all duration-500 ease-out';
    notification.innerHTML = `
      <div class="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden min-w-[320px] max-w-[400px]">
        <div class="absolute inset-0 bg-gradient-to-r from-green-400/10 via-teal-400/10 to-blue-400/10 animate-pulse"></div>
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400"></div>
        <div class="relative p-4 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3-.672 3-1.5S13.657 8 12 8zm0 8c-1.657 0-3 .672-3 1.5S10.343 19 12 19s3-.672 3-1.5S13.657 16 12 16zm0-12c-1.657 0-3 .672-3 1.5S10.343 7 12 7s3-.672 3-1.5S13.657 4 12 4z"></path>
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/90 mb-1">Currency Updated</div>
            <div className="text-lg font-bold text-white capitalize">${currencyName} Currency Active</div>
            <div className="text-xs text-white/70 mt-1">Changes synced across devices</div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="progress-bar h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-[4000ms] ease-linear" style="width: 100%"></div>
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="particle absolute w-2 h-2 bg-white/30 rounded-full animate-ping" style="top: 20%; left: 10%; animation-delay: 0s;"></div>
          <div className="particle absolute w-1 h-1 bg-white/40 rounded-full animate-ping" style="top: 60%; right: 15%; animation-delay: 0.5s;"></div>
          <div className="particle absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style="bottom: 30%; left: 20%; animation-delay: 1s;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
    }, 50);

    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'translateX(0) scale(1.02)';
    });

    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'translateX(0) scale(1)';
    });

    setTimeout(() => {
      const progressBar = notification.querySelector('.progress-bar') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = '0%';
      }
    }, 100);

    setTimeout(() => {
      notification.classList.add('animate-pulse');
      setTimeout(() => {
        notification.style.transform = 'translateX(full) scale(0.8)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }, 200);
    }, 4000);

    notification.addEventListener('click', () => {
      notification.style.transform = 'translateX(full) scale(0.8)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    });
  };

  useEffect(() => {
    console.log('Settings loading useEffect triggered', {
      isAuthenticated,
      token: !!token,
      isLoading,
      themeLoaded,
    });

    if (!themeLoaded && isAuthenticated) {
      loadUserSettings();
    }

    window.addEventListener('settingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
      if (themePollingIntervalRef.current) {
        clearInterval(themePollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, isLoading, token, themeLoaded]);

  useEffect(() => {
    return () => {
      if (themePollingIntervalRef.current) {
        clearInterval(themePollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('Route protection useEffect triggered', {
      isAuthenticated,
      pathname,
      permissionsLoaded,
      userPermissions,
    });

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      console.log('Redirecting to login: User not authenticated');
      router.replace('/Registration/login');
      return;
    }

    if (isAuthenticated && pathname === '/Registration/login') {
      console.log('Redirecting to dashboard: User authenticated on login page');
      router.replace('/Dashboard/dashboard');
      return;
    }

    if (isAuthenticated && !publicRoutes.includes(pathname) && permissionsLoaded) {
      const requiredPermission = routePermissions[pathname];
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        console.log(`Access denied to ${pathname}: Missing permission ${requiredPermission}`);
        console.log('User permissions:', userPermissions);
        router.replace('/NoAccess');
      } else {
        console.log(`Access granted to ${pathname}`);
      }
    }
  }, [isAuthenticated, pathname, router, userPermissions, permissionsLoaded, routePermissions]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleRouteChange = () => {
      setIsPageLoading(true);
      timeoutId = setTimeout(() => setIsPageLoading(false), 500);
    };

    const prevPathname = pathname;
    const checkPathChange = () => {
      if (prevPathname !== pathname) {
        handleRouteChange();
      }
    };

    const interval = setInterval(checkPathChange, 100);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      if (themePollingIntervalRef.current) {
        clearInterval(themePollingIntervalRef.current);
      }

      await logout();
      setSidebarOpen(false);
      setThemeLoaded(false);
      console.log('User logged out successfully');
      await router.replace('/Registration/login');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/Registration/login';
    }
  };

  // Render logic: Skip initial loading spinner
  if (!isAuthenticated && publicRoutes.includes(pathname)) {
    return <Component {...pageProps} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isAuthenticated && pathname === '/Registration/login') {
    return null; // Avoid rendering login page; redirect is handled
  }

  if (!Sidebar) {
    console.error('Sidebar component is undefined');
    return <div>Sidebar failed to load</div>;
  }

  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20';
  const contentMargin = sidebarOpen ? 'ml-80' : 'ml-28';
  const headerHeight = 'h-16';

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
      <Header
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onNavigate={(path: string) => router.push(path)}
        token={token}
        user={user}
        className={headerHeight}
      />
      <div className="flex flex-1 overflow-hidden mt-10" style={{ backgroundColor: 'var(--background-color)' }}>
        <Sidebar
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 ${sidebarWidth} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl transition-all duration-300 ease-in-out`}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
          userPermissions={userPermissions}
        />
        <main
          className={`flex-1 ${contentMargin} overflow-auto p-4 transition-all duration-300 ease-in-out main-content-container`}
          style={{
            backgroundColor: 'var(--background-color)',
            zoom: '0.8',
          }}
        >
          {isPageLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
              </div>
            </div>
          ) : (
            <Component {...pageProps} key={pathname} currentCurrency={currentCurrency} />
          )}
        </main>
      </div>
      <Footer
        className={`p-4 shadow-inner ${contentMargin} transition-all duration-300 ease-in-out`}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
}
