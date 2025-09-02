import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { AppProps } from 'next/app';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import 'shared-tailwind/styles';
import '@fontsource/nunito';
import {
  fetchUserDetails,
  fetchPublicStoreDetails,
  applyThemeToDOM,
  applyCurrencyToDOM,
  getStoredSettings,
  saveSettingsToStorage,
  clearStoredSettings,
  extractSlugFromPath,
  getPathWithoutSlug,
  showThemeChangeNotification,
  showCurrencyChangeNotification,
  dispatchSettingsLoadedEvent
} from '../services/AppService';

const FallbackHeader = () => <div>Header failed to load</div>;
const FallbackFooter = () => <div>Footer failed to load</div>;

const Header = dynamic(
    () => import('remoteApp/Header').catch((err) => {
      console.error('Header load error:', err);
      return FallbackHeader;
    }),
    { ssr: false }
);

import Sidebar from '../components/Sidebar';

const Footer = dynamic(
    () => import('remoteApp/Footer').catch((err) => {
      console.error('Footer load error:', err);
      return FallbackFooter;
    }),
    { ssr: false }
);

const publicRoutes = ['/Registration/login', '/Registration/forgotPassword', '/Registration/registerAdmin', '/public/[slug]', '/NoAccess'];

const isPublicRoute = (pathname: string | null): boolean => {
  if (!pathname) return false;
  if (pathname.startsWith('/public/')) return true;
  return publicRoutes.some(route => {
    if (route === '/public/[slug]') return pathname.startsWith('/public/');
    return pathname === route || pathname.startsWith(route);
  });
};

function AppContent({ Component, pageProps, router }: AppProps) { // Add router to AppContent props
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentCurrency, setCurrentCurrency] = useState('pkr');
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string>('');

  const themePollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownThemeRef = useRef<string>('default');
  const lastKnownCurrencyRef = useRef<string>('pkr');

  const { isAuthenticated, isLoading, logout, token, user, userPermissions } = useAuth();
  const nextRouter = useRouter(); // Rename to avoid conflict with prop
  const pathname = usePathname();

  const actualPathname = pathname || (typeof window !== 'undefined' ? window.location.pathname : null);
  const extractedSlug = extractSlugFromPath(actualPathname);
  const pathWithoutSlug = getPathWithoutSlug(actualPathname, extractedSlug);
  const isCurrentRoutePublic = isPublicRoute(actualPathname);

  const loadUserSettings = async () => {
    if (!token) {
      const savedSettings = getStoredSettings();
      console.log('No token, using saved settings:', savedSettings);

      setCurrentTheme(savedSettings.theme);
      setCurrentCurrency(savedSettings.currency);
      setCurrentSlug(savedSettings.slug || null);
      setStoreName(savedSettings.storeName);

      applyThemeToDOM(savedSettings.theme);
      applyCurrencyToDOM(savedSettings.currency);

      lastKnownThemeRef.current = savedSettings.theme;
      lastKnownCurrencyRef.current = savedSettings.currency;
      setThemeLoaded(true);
      return;
    }

    try {
      console.log('Fetching user settings from API...');
      const userDetails = await fetchUserDetails(token, logout);

      const userTheme = userDetails.user?.theme || 'default';
      const userCurrency = userDetails.user?.currency || 'pkr';
      const userStoreName = userDetails.user?.store_name || '';
      const slug = userDetails.user?.slug || '';
      const userType = userDetails.user?.user_type || '';

      console.log('Loaded user settings from API:', {
        theme: userTheme,
        currency: userCurrency,
        storeName: userStoreName,
        slug,
        userType
      });

      setCurrentTheme(userTheme);
      setCurrentCurrency(userCurrency);
      setStoreName(userStoreName);
      setCurrentSlug(slug || null);

      saveSettingsToStorage({
        theme: userTheme,
        currency: userCurrency,
        slug,
        storeName: userStoreName
      });

      applyThemeToDOM(userTheme);
      applyCurrencyToDOM(userCurrency);

      lastKnownThemeRef.current = userTheme;
      lastKnownCurrencyRef.current = userCurrency;
      setThemeLoaded(true);

      if (isAuthenticated && actualPathname && !actualPathname.startsWith('/public/') && !publicRoutes.includes(actualPathname)) {
        const expectedSlugPrefix = `/${slug}`;
        if (userType === 'rider') {
          if (actualPathname === '/' || actualPathname.includes('/Dashboard')) {
            const ordersPath = `/${slug}/Orders/orders`;
            nextRouter.replace(ordersPath);
            return;
          }
          if (!actualPathname.includes('/Orders')) {
            const ordersPath = `/${slug}/Orders/orders`;
            nextRouter.replace(ordersPath);
            return;
          }
        } else {
          if (actualPathname === '/') {
            const newPath = `/${slug}/Dashboard/dashboard`;
            nextRouter.replace(newPath);
          } else if (!actualPathname.startsWith(expectedSlugPrefix)) {
            let pathWithoutAnySlug = actualPathname.replace(/^\/[^\/]+/, '');
            if (!pathWithoutAnySlug || pathWithoutAnySlug.toLowerCase() === '/dashboard') {
              pathWithoutAnySlug = '/Dashboard/dashboard';
            }
            const newPath = `/${slug}${pathWithoutAnySlug}`;
            console.log('Redirecting from', actualPathname, 'to', newPath);
            nextRouter.replace(newPath);
          }
        }
      }

      dispatchSettingsLoadedEvent({
        theme: userTheme,
        currency: userCurrency,
        slug,
        storeName: userStoreName,
        userType
      });
    } catch (error) {
      console.error('Error loading user settings:', error);
      const savedSettings = getStoredSettings();

      console.log('API failed, using saved settings:', savedSettings);

      setCurrentTheme(savedSettings.theme);
      setCurrentCurrency(savedSettings.currency);
      setCurrentSlug(savedSettings.slug || null);
      setStoreName(savedSettings.storeName);

      applyThemeToDOM(savedSettings.theme);
      applyCurrencyToDOM(savedSettings.currency);

      lastKnownThemeRef.current = savedSettings.theme;
      lastKnownCurrencyRef.current = savedSettings.currency;
      setThemeLoaded(true);
    }
  };

  const handleSettingsChange = () => {
    console.log('Settings changed, reloading user settings...');
    loadUserSettings();
  };

  useEffect(() => {
    console.log('Settings loading useEffect triggered', {
      isAuthenticated,
      token: !!token,
      isLoading,
      themeLoaded,
      isCurrentRoutePublic,
    });

    if (isCurrentRoutePublic && !themeLoaded) {
      const savedSettings = getStoredSettings();
      setCurrentTheme(savedSettings.theme);
      setCurrentCurrency(savedSettings.currency);
      applyThemeToDOM(savedSettings.theme);
      applyCurrencyToDOM(savedSettings.currency);
      setThemeLoaded(true);
    }

    if (isAuthenticated && !isCurrentRoutePublic) {
      loadUserSettings();
    }

    window.addEventListener('settingsChanged', handleSettingsChange);

    return () => {
      window.removeEventListener('settingsChanged', handleSettingsChange);
      if (themePollingIntervalRef.current) {
        clearInterval(themePollingIntervalRef.current);
      }
    };
  }, [isAuthenticated, isLoading, token, themeLoaded, isCurrentRoutePublic]);

  useEffect(() => {
    return () => {
      if (themePollingIntervalRef.current) {
        clearInterval(themePollingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
    }
  }, [initialLoad]);

  useEffect(() => {
    console.log('Route protection useEffect triggered', {
      isAuthenticated,
      pathname,
      actualPathname,
      pathWithoutSlug,
      extractedSlug,
      currentSlug,
      isLoading,
      initialLoad,
      isCurrentRoutePublic,
      userType: user?.user_type
    });

    if (isCurrentRoutePublic) {
      console.log('Public route detected, skipping all authentication checks');
      return;
    }

    if (isLoading || initialLoad) {
      console.log('Still loading, skipping route protection');
      return;
    }

    if (!isAuthenticated && !isCurrentRoutePublic) {
      console.log('Redirecting to login: User not authenticated for protected route');
      router.replace('/Registration/login');
      return;
    }

    if (isAuthenticated && pathWithoutSlug === '/Registration/login' && !initialLoad) {
      console.log('Redirecting based on user type: User authenticated on login page');
      const slug = currentSlug || localStorage.getItem('restaurantSlug') || '';
      if (user?.user_type === 'rider') {
        const ordersPath = slug ? `/${slug}/Orders/orders` : '/Orders/orders';
        router.replace(ordersPath);
      } else {
        const dashboardPath = slug ? `/${slug}/Dashboard/dashboard` : '/Dashboard/dashboard';
        router.replace(dashboardPath);
      }
      return;
    }

    if (isAuthenticated && pathWithoutSlug === '/Registration/registerAdmin') {
      return;
    }
  }, [isAuthenticated, isLoading, initialLoad, pathWithoutSlug, currentSlug, user, router, actualPathname, isCurrentRoutePublic]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleRouteChange = () => {
      setIsPageLoading(true);
      timeoutId = setTimeout(() => setIsPageLoading(false), 500);
    };

    if (pathname) {
      handleRouteChange();
    }

    return () => {
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
      setInitialLoad(true);
      setCurrentSlug(null);
      setStoreName('');

      clearStoredSettings();

      console.log('User logged out successfully');
      await router.replace('/Registration/login');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/Registration/login';
    }
  };

  const navigateWithSlug = (path: string) => {
    const slug = currentSlug || extractedSlug || '';
    const fullPath = slug ? `/${slug}${path}` : path;
    router.push(fullPath);
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      (faviconLink as HTMLLinkElement).rel = 'icon';
      document.head.appendChild(faviconLink);
    }


    const updateFaviconForPublicRoute = async () => {
      if (pathname && pathname.startsWith('/public/') && extractedSlug) {
        try {
          const storeDetails = await fetchPublicStoreDetails(extractedSlug);
          const storeLogo = storeDetails?.store_logo;
          if (storeLogo && faviconLink) {
            faviconLink.href = storeLogo;
            faviconLink.type = 'image/jpeg';
          }
        } catch (error) {
          console.error('Error fetching store logo for favicon:', error);
        }
      } else if (user?.store_logo && faviconLink && (!pathname || !pathname.startsWith('/public/'))) {
        faviconLink.href = user.store_logo;
        faviconLink.type = 'image/jpeg';
      } else if (faviconLink) {
        faviconLink.href = '/default-favicon.ico';
      }
    };

    updateFaviconForPublicRoute();

    let title = '';
    if (pathname && pathname.startsWith('/public/')) {
      title = extractedSlug ? extractedSlug.charAt(0).toUpperCase() + extractedSlug.slice(1) : 'Restaurant';
    } else {
      const pageName = pathWithoutSlug
          .split('/')
          .filter(Boolean)
          .pop()
          ?.charAt(0)
          .toUpperCase() + (pathWithoutSlug.split('/').pop()?.slice(1).toLowerCase() || '') || 'Dashboard';
      title = `${storeName ? `${storeName} - ` : ''}${pageName}`;
    }
    document.title = title;
  }, [user, storeName, pathWithoutSlug, pathname, extractedSlug]);

  if ((isLoading || initialLoad) && !isCurrentRoutePublic) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
            {storeName && (
                <p className="mt-2 text-sm text-gray-500">{storeName}</p>
            )}
          </div>
        </div>
    );
  }

  if (isCurrentRoutePublic) {
    console.log('Rendering public route directly');
    return <Component {...pageProps} key={pathname} currentCurrency={currentCurrency} restaurantSlug={extractedSlug} storeName={storeName} />;
  }

  if (!isAuthenticated) {
    console.log('Redirecting to login: User not authenticated');
    router.replace('/Registration/login');
    return null;
  }

  if (isAuthenticated && pathWithoutSlug === '/Registration/login') {
    console.log('Redirecting to dashboard: User authenticated on login page');
    const slug = currentSlug || localStorage.getItem('restaurantSlug') || '';
    const dashboardPath = slug ? `/${slug}/Dashboard/dashboard` : '/Dashboard/dashboard';
    router.replace(dashboardPath);
    return null;
  }

  if (isAuthenticated && pathWithoutSlug === '/Registration/registerAdmin') {
    return <Component {...pageProps} key={pathname} currentCurrency={currentCurrency} restaurantSlug={extractedSlug} storeName={storeName} />;
  }

  if (!Sidebar) {
    console.error('Sidebar component is undefined');
    return <div>Sidebar failed to load</div>;
  }

  const sidebarWidth = sidebarOpen ? 'w-64' : 'w-20';
  const contentMargin = sidebarOpen ? 'ml-80' : 'ml-28';
  const headerHeight = 'h-16';
// _app.tsx, in AppContent
  const normalizedUser = user ? {
    ...user,
    role_id: user.role_id ?? null // Convert undefined to null
  } : null;

  return (
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
        <Header
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
            onNavigate={navigateWithSlug}
            token={token}
            user={normalizedUser}
            className={headerHeight}
            restaurantSlug={extractedSlug}
            storeName={storeName}
        />
        <div className="flex flex-1 overflow-hidden mt-10" style={{ backgroundColor: 'var(--background-color)' }}>
          <Sidebar
              className={`fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 ${sidebarWidth} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl transition-all duration-300 ease-in-out`}
              setSidebarOpen={setSidebarOpen}
              sidebarOpen={sidebarOpen}
              userPermissions={userPermissions}
              onNavigate={navigateWithSlug}
              restaurantSlug={extractedSlug}
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
                    {storeName && (
                        <p className="mt-2 text-sm text-gray-500">{storeName}</p>
                    )}
                  </div>
                </div>
            ) : (
                <Component {...pageProps} key={pathname} currentCurrency={currentCurrency} restaurantSlug={extractedSlug} storeName={storeName} />
            )}
          </main>
        </div>
        <Footer
            className={`p-4 shadow-inner ${contentMargin} transition-all duration-300 ease-in-out`}
            sidebarOpen={sidebarOpen}
            restaurantSlug={extractedSlug}
        />
      </div>
  );
}

export default function MyApp({ Component, pageProps, router }: AppProps) {
  return (
      <AuthProvider>
        <AppContent Component={Component} pageProps={pageProps} router={router} /> {/* Pass router to AppContent */}
      </AuthProvider>
  );
}