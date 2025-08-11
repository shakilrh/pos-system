import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { adminAuthService } from '../../services/adminAuthService';
import FlashMessage from '../FlashMessage';

export default function Login() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{ email?: string[]; password?: string[] }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (!email.trim()) {
      errors.push('Email address is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Please enter a valid email address');
      }
      if (email.includes('..')) {
        errors.push('Email cannot contain consecutive dots');
      }
      if (email.startsWith('.') || email.endsWith('.')) {
        errors.push('Email cannot start or end with a dot');
      }
      if (email.length > 254) {
        errors.push('Email address is too long (max 254 characters)');
      }
      if (email.includes(' ')) {
        errors.push('Email address cannot contain spaces');
      }
    }
    return errors;
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (!password.trim()) {
      errors.push('Password is required');
    }
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') {
      setEmail(value);
      if (touched.email) {
        setErrors(prev => ({ ...prev, email: validateEmail(value) }));
      }
    }
    if (field === 'password') {
      setPassword(value);
      if (touched.password) {
        setErrors(prev => ({ ...prev, password: validatePassword(value) }));
      }
    }
  };

  const handleFocus = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    }
    if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleBlur = (field: string) => {
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    }
    if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const isFormValid = () => {
    const emailErrors = validateEmail(email);
    const passwordErrors = validatePassword(password);
    return emailErrors.length === 0 && passwordErrors.length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const emailErrors = validateEmail(email);
    const passwordErrors = validatePassword(password);

    if (emailErrors.length > 0 || passwordErrors.length > 0) {
      setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
      setErrors({ email: emailErrors, password: passwordErrors });
      return;
    }

    setLoading(true);
    try {
      await adminAuthService.loginAdmin(email, password, logout);
      await login(email, password); // Now includes permission loading
      setFlashMessage({ message: 'Login successful! Redirecting...', type: 'success' });
      setEmail('');
      setPassword('');
      setErrors({});
      setTouched({});
      router.replace('/Dashboard/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setFlashMessage({
        message: error.message || 'Invalid email or password. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRedirect = () => {
    router.push('/Registration/registerAdmin');
  };

  const handleForgotPasswordRedirect = () => {
    router.push('/Registration/forgotPassword');
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400 to-red-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-400 to-pink-400 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-10 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="flex w-full max-w-5xl h-auto bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-2xl overflow-hidden animate-fade-in relative z-10">
          <div className="w-1/2 bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10 text-center">
              <div className="text-6xl font-bold text-white mb-4 drop-shadow-lg animate-bounce">🍽️ Rasant</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                Admin Portal
              </h3>
              <p className="text-orange-100 text-base leading-relaxed max-w-sm mb-6">
                Welcome back! Access your dashboard to manage your restaurant with professional tools and insights.
              </p>
              <div className="flex items-center justify-center space-x-4 text-orange-200">
                <div className="flex flex-col items-center">
                  <div className="text-2xl mb-1">📊</div>
                  <span className="text-sm">Analytics</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl mb-1">🛒</div>
                  <span className="text-sm">Orders</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-2xl mb-1">👥</div>
                  <span className="text-sm">Customers</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mb-16 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -ml-10 -mt-10 animate-pulse animation-delay-2000"></div>
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse animation-delay-4000"></div>
          </div>

          <div className="w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <div className="max-w-sm mx-auto w-full">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Sign in to your admin dashboard</p>
              </div>

              {flashMessage && (
                  <FlashMessage
                      message={flashMessage.message}
                      type={flashMessage.type}
                      onClose={() => setFlashMessage(null)}
                      className="mb-6"
                  />
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      placeholder="Enter your email address"
                      className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                          errors.email && errors.email.length > 0
                              ? 'border-red-400 ring-2 ring-red-200'
                              : 'border-gray-200 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                      autoComplete="username"
                      aria-invalid={errors.email && errors.email.length > 0}
                      aria-describedby={errors.email && errors.email.length > 0 ? 'email-error' : undefined}
                  />
                  {errors.email && errors.email.length > 0 && (
                      <div id="email-error" className="mt-1 space-y-1">
                        {errors.email.map((error, index) => (
                            <p key={index} className="text-red-500 text-xs flex items-start">
                              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {error}
                            </p>
                        ))}
                      </div>
                  )}
                  {touched.email && (!errors.email || errors.email.length === 0) && email.trim() && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Valid email address
                      </p>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      placeholder="Enter your password"
                      className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 pr-12 ${
                          errors.password && errors.password.length > 0
                              ? 'border-red-400 ring-2 ring-red-200'
                              : 'border-gray-200 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                      autoComplete="current-password"
                      aria-invalid={errors.password && errors.password.length > 0}
                      aria-describedby={errors.password && errors.password.length > 0 ? 'password-error' : undefined}
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </>
                      )}
                    </svg>
                  </button>
                  {errors.password && errors.password.length > 0 && (
                      <div id="password-error" className="mt-1 space-y-1">
                        {errors.password.map((error, index) => (
                            <p key={index} className="text-red-500 text-xs flex items-start">
                              <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {error}
                            </p>
                        ))}
                      </div>
                  )}
                  {touched.password && (!errors.password || errors.password.length === 0) && password.trim() && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Password entered
                      </p>
                  )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className={`w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-4 rounded-xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl ${
                        loading || !isFormValid()
                            ? 'opacity-70 cursor-not-allowed'
                            : 'hover:scale-[1.02] transform hover:-translate-y-1'
                    }`}
                >
                  {loading ? (
                      <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                  ) : (
                      '🔑 Sign In to Dashboard'
                  )}
                </button>

                <div className="flex items-center justify-between pt-4">
                  <button
                      type="button"
                      onClick={handleRegisterRedirect}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-semibold"
                  >
                    Create Account
                  </button>
                  <button
                      type="button"
                      onClick={handleForgotPasswordRedirect}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      </div>
  );
}