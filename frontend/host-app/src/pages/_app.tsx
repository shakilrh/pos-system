import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import 'shared-tailwind/styles';

const Header = dynamic(
  () => import('remoteApp/Header').catch((err) => {
    console.error('Header load error:', err);
    return () => <div>Header failed to load</div>;
  }),
  { ssr: false }
);

import Sidebar from '../components/Sidebar';

const Footer = dynamic(
  () => import('remoteApp/Footer').catch((err) => {
    console.error('Footer load error:', err);
    return () => <div>Footer failed to load</div>;
  }),
  { ssr: false }
);

const publicRoutes = ['/login', '/forgot-password'];

function AppContent({ Component, pageProps }: AppProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDarkMode = () => setDarkMode(!darkMode);

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

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Header onSidebarToggle={toggleSidebar} onDarkModeToggle={toggleDarkMode} darkMode={darkMode} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
        <main className={`flex-1 pt-16 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-64'
        }`}>
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
