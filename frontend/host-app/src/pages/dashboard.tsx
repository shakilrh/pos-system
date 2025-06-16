import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { isAuthenticated, isLoading, user, token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      console.log('Dashboard accessed, current token:', token);
    }
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, token]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Admin'}!</h1>
      <p className="mt-2">You have successfully logged in to the Rasant Admin Dashboard.</p>
      <button
        onClick={logout}
        className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
      >
        Logout
      </button>
    </div>
  );
}
//test
