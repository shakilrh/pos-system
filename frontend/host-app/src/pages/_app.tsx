import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import 'shared-tailwind/styles';

// Fallback components
const FallbackHeader = () => <div>Header failed to load</div>;
const FallbackFooter = () => <div>Footer failed to load</div>;

const Header = dynamic(
  () => import('remoteApp/Header').catch((err) => {
    console.error('Header load error:', err);
    return () => FallbackHeader;
  }),
  { ssr: false }
);

import Sidebar from '../components/Sidebar'; // Ensure this path is correct

const Footer = dynamic(
  () => import('remoteApp/Footer').catch((err) => {
    console.error('Footer load error:', err);
    return () => FallbackFooter;
  }),
  { ssr: false }
);

const publicRoutes = ['/login', '/forgot-password', '/RegisterAdmin'];

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = async () => {
    try {
      await logout();
      setSidebarOpen(false);
      await router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.href = '/login';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated && publicRoutes.includes(pathname)) {
    return <Component {...pageProps} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!Sidebar) {
    console.error('Sidebar component is undefined');
    return <div>Sidebar failed to load</div>;
  }

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onDarkModeToggle={toggleDarkMode}
        darkMode={darkMode}
        onLogout={handleLogout}
        onNavigate={(path: string) => router.push(path)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          className={`top-16 z-40 ${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-2xl`}
          setSidebarOpen={setSidebarOpen}
          sidebarOpen={sidebarOpen}
        />
        <main className={`flex-1 mt-16  bg-gray-100 overflow-auto ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          <Component {...pageProps} />
        </main>
      </div>
      <Footer />
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
