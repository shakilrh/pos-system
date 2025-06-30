import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthService } from '../../services/adminAuthService';
import toast from 'react-hot-toast';

export default function RegisterAdmin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeName: ''
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF)');
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setLogo(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim() || !formData.storeName.trim()) {
      toast.error('All fields are required');
      return;
    }

    if (!logo) {
      toast.error('Please select a logo image');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await adminAuthService.registerAdmin(
        formData.name,
        formData.email,
        formData.password,
        logo,
        formData.storeName
      );

      toast.success('Admin registered successfully');

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        storeName: ''
      });
      setLogo(null);

      // Redirect to login
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register admin');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="flex w-full max-w-6xl h-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Left Side - Branding */}
        <div className="w-1/2 bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 text-center">
            <div className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🍽️ Rasant</div>
            <h3 className="text-2xl font-semibold mb-4">Welcome to Admin Portal</h3>
            <p className="text-orange-100 text-base leading-relaxed max-w-sm">
              Create your admin account to manage your restaurant efficiently with our powerful management tools.
            </p>
          </div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mb-16"></div>
          <div className="absolute top-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -ml-10 -mt-10"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Create Admin Account</h2>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Name & Email Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm"
                  required
                />
              </div>

              {/* Store Name */}
              <div>
                <label htmlFor="storeName" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  id="storeName"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  placeholder="Your store name"
                  className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label htmlFor="logo" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Store Logo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleLogoChange}
                    className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 dark:file:bg-gray-600 dark:file:text-gray-200"
                    required
                  />
                </div>
                {logo && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {logo.name}
                  </p>
                )}
              </div>

              {/* Submit Button */}
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
                    Creating Account...
                  </span>
                ) : (
                  '🚀 Create Admin Account'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleLoginRedirect}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-medium"
                >
                  Already have an account? <span className="text-orange-500 hover:underline">Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
