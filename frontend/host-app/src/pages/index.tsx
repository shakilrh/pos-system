import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Dashboard from '../pages/Dashboard/dashboard';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, restaurantSlug } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace('/Registration/login');
      return;
    }

    const dashboardPath = restaurantSlug ? `/${restaurantSlug}/Dashboard/dashboard` : '/Dashboard/dashboard';
    router.replace(dashboardPath);
  }, [isAuthenticated, isLoading, restaurantSlug, router]);

  if (isLoading || !isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
          </div>
        </div>
    );
  }

  return <Dashboard />;
}