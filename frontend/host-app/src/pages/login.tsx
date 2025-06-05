import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      router.push('/Dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex w-full h-screen animate-fade-in">
        {/* Left Side - Branding */}
        <div className="w-1/2 bg-gradient-to-br from-gray-800 to-gray-900 text-white p-16 flex flex-col justify-center items-center">
          <div className="text-5xl font-bold text-orange-500 mb-6">🍽️ Rasant</div>
          <p className="text-gray-300 text-lg text-center max-w-md leading-relaxed">
            Welcome back to Rasant Admin Panel! Access your dashboard to manage your restaurant with professional tools and insights.
          </p>
        </div>
        {/* Right Side - Form */}
        <div className="w-1/2 bg-white dark:bg-gray-800 p-16 flex flex-col justify-center">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8 text-center">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-lg"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-lg"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 text-lg font-medium"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
