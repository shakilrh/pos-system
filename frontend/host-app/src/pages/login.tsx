import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { adminAuthService } from '../services/adminAuthService';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success('Login successful');
      router.push('Dashboard/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const userData = await adminAuthService.loginAdmin(email, password, logout);
      await login(email, password); // Your existing auth context login
      toast.success('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    router.push('Registration/registerAdmin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="flex w-full max-w-5xl h-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="w-1/2 bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 text-center">
            <div className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🍽️ Rasant</div>
            <h3 className="text-2xl font-semibold mb-4">Admin Portal</h3>
            <p className="text-orange-100 text-base leading-relaxed max-w-sm">
              Welcome back! Access your dashboard to manage your restaurant with professional tools and insights.
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mb-16"></div>
          <div className="absolute top-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -ml-10 -mt-10"></div>
        </div>
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm"
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm"
                  required
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] transform'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  '🔑 Sign In to Dashboard'
                )}
              </button>
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRegisterRedirect}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-medium"
                >
                  Create Account
                </button>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-medium">
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
