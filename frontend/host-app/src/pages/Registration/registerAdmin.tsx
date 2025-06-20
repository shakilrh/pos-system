import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Interface for API response
interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: any;
  error?: string | null;
  details?: any;
}

export default function RegisterAdmin() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApiError = (response: ApiResponse): string => {
    if (!response.success) {
      console.error('API Error:', response);
      switch (response.error) {
        case 'BAD_REQUEST':
          return response.message || 'Invalid input provided';
        case 'ALREADY_EXISTS':
          return response.message || 'Admin with this email already exists';
        case 'UNAUTHORIZED':
          return 'Unauthorized access';
        case 'DATA_NOT_FOUND':
          return 'Resource not found';
        case 'CONFLICT':
          return response.message || 'Please try again';
        case 'FORBIDDEN':
          return 'Access denied';
        case 'MONGO_EXCEPTION':
          console.error('MongoDB Error Details:', response.details);
          return 'Database error occurred';
        case 'DB_ERROR':
          return response.message || 'Database error occurred';
        case 'INTERNAL_SERVER_ERROR':
        default:
          return 'An unexpected error occurred';
      }
    }
    return '';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://192.168.18.107:3000/users/api/v1/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to register admin');
      }

      if (data.success && data.type === 1) {
        toast.success('Admin registered successfully');
        setName('');
        setEmail('');
        setPassword('');
        router.push('/login');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register admin';
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
            Create your Rasant Admin Account and take control of your restaurant management with ease. Join us to streamline operations and enhance your business efficiency.
          </p>
        </div>
        {/* Right Side - Form */}
        <div className="w-1/2 bg-white dark:bg-gray-800 p-16 flex flex-col justify-center">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8 text-center">Create Admin Account</h2>
          <form onSubmit={handleRegister} className="space-y-6 max-w-md mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-300 text-lg"
              required
            />
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
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
