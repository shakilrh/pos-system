import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthService } from '../../services/adminAuthService';
import FlashMessage from '../FlashMessage';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [formData, setFormData] = useState({
    email: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{
    email?: string[];
    resetCode?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (!email.trim()) errors.push('Email is required');
    else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
      if (email.length > 254) errors.push('Email address is too long');
      if (email.includes('..')) errors.push('Email cannot contain consecutive dots');
    }
    return errors;
  };

  const validateResetCode = (code: string): string[] => {
    const errors: string[] = [];
    if (!code.trim()) errors.push('Reset code is required');
    else if (!/^\d{6}$/.test(code)) errors.push('Reset code must be a 6-digit number');
    return errors;
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (!password.trim()) errors.push('Password is required');
    else {
      if (password.length < 8) errors.push('Password must be at least 8 characters long');
      if (password.length > 128) errors.push('Password must be less than 128 characters');
      if (!/[A-Z]/.test(password)) errors.push('Password must include at least one uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('Password must include at least one lowercase letter');
      if (!/[0-9]/.test(password)) errors.push('Password must include at least one number');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
        errors.push('Password must include at least one special character');
      if (/\s/.test(password)) errors.push('Password cannot contain spaces');
      if (/(.)\1{2,}/.test(password)) errors.push('Password cannot contain more than 2 consecutive identical characters');
    }
    return errors;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string[] => {
    const errors: string[] = [];
    if (!confirmPassword.trim()) errors.push('Please confirm your password');
    else if (confirmPassword !== password) errors.push('Passwords do not match');
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'email': return validateEmail(formData.email);
      case 'resetCode': return validateResetCode(formData.resetCode);
      case 'newPassword': return validatePassword(formData.newPassword);
      case 'confirmPassword': return validateConfirmPassword(formData.confirmPassword, formData.newPassword);
      default: return [];
    }
  };

  const isFormValid = (): boolean => {
    if (step === 'request') return validateEmail(formData.email).length === 0;
    return (
        validateEmail(formData.email).length === 0 &&
        validateResetCode(formData.resetCode).length === 0 &&
        validatePassword(formData.newPassword).length === 0 &&
        validateConfirmPassword(formData.confirmPassword, formData.newPassword).length === 0
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touchedFields.has(name)) {
      setErrors((prev) => ({
        ...prev,
        [name]: getFieldErrors(name === 'confirmPassword' ? 'confirmPassword' : name),
      }));
    }

    if (name === 'newPassword' && touchedFields.has('confirmPassword')) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(formData.confirmPassword, value),
      }));
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    setErrors((prev) => ({ ...prev, [fieldName]: getFieldErrors(fieldName) }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(name)) {
      setErrors((prev) => ({ ...prev, [fieldName]: getFieldErrors(fieldName) }));
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields(new Set(['email']));
    const emailErrors = validateEmail(formData.email);
    setErrors({ email: emailErrors });

    if (emailErrors.length > 0) {
      setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await adminAuthService.forgotPassword(formData.email);
      setFlashMessage({ message: 'Reset code sent to your email!', type: 'success' });
      setStep('reset');
    } catch (error: any) {
      setFlashMessage({ message: error.message || 'Failed to send reset code. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['email', 'resetCode', 'newPassword', 'confirmPassword'];
    setTouchedFields(new Set(allFields));

    const allErrors: any = {};
    allFields.forEach((field) => {
      allErrors[field] = getFieldErrors(field);
    });
    setErrors(allErrors);

    if (Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0)) {
      setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await adminAuthService.resetPassword(formData.email, formData.resetCode, formData.newPassword);
      setFlashMessage({ message: 'Password reset successfully! Redirecting to login...', type: 'success' });
      setTimeout(() => router.push('/Registration/login'), 2000);
    } catch (error: any) {
      setFlashMessage({ message: error.message || 'Failed to reset password. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => router.push('/Registration/login');

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0) return null;

    return (
        <div className="mt-1 space-y-1">
          {fieldErrors.map((error, index) => (
              <p key={index} className="text-red-500 text-xs flex items-start">
                <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
          ))}
        </div>
    );
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400 to-red-400 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-400 to-pink-400 rounded-full opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-10 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="flex w-full max-w-6xl h-auto bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-2xl overflow-hidden animate-fade-in relative z-10">
          <div className="w-1/2 bg-gradient-to-br from-orange-500 to-red-600 text-white p-8 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10 text-center">
              <div className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🍽️ Rasant</div>
              <h3 className="text-2xl font-semibold mb-4">Password Recovery</h3>
              <p className="text-orange-100 text-base leading-relaxed max-w-sm">
                Reset your password securely to regain access to your admin portal.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mb-16 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -ml-10 -mt-10 animate-pulse animation-delay-2000"></div>
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse animation-delay-4000"></div>
          </div>

          <div className="w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <div className="max-w-sm mx-auto w-full">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
                {step === 'request' ? 'Forgot Password' : 'Reset Password'}
              </h2>
              {flashMessage && (
                  <FlashMessage
                      message={flashMessage.message}
                      type={flashMessage.type}
                      onClose={() => setFlashMessage(null)}
                      className="mb-4"
                  />
              )}
              <form onSubmit={step === 'request' ? handleRequestReset : handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      placeholder="john@example.com"
                      disabled={step === 'reset'}
                      className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                          errors.email && errors.email.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                  />
                  {renderFieldErrors('email')}
                </div>

                {step === 'reset' && (
                    <>
                      <div>
                        <label htmlFor="resetCode" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Reset Code *
                        </label>
                        <input
                            type="text"
                            id="resetCode"
                            name="resetCode"
                            value={formData.resetCode}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('resetCode')}
                            onBlur={() => handleBlur('resetCode')}
                            placeholder="123456"
                            className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                                errors.resetCode && errors.resetCode.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                            } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                        />
                        {renderFieldErrors('resetCode')}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <label htmlFor="newPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                            New Password *
                          </label>
                          <input
                              type={showNewPassword ? 'text' : 'password'}
                              id="newPassword"
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              onFocus={() => handleFocus('newPassword')}
                              onBlur={() => handleBlur('newPassword')}
                              placeholder="Enter new password"
                              className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border pr-10 ${
                                  errors.newPassword && errors.newPassword.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                              } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                          />
                          <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {showNewPassword ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              ) : (
                                  <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </>
                              )}
                            </svg>
                          </button>
                          {renderFieldErrors('newPassword')}
                        </div>

                        <div className="relative">
                          <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                            Confirm Password *
                          </label>
                          <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              onFocus={() => handleFocus('confirmPassword')}
                              onBlur={() => handleBlur('confirmPassword')}
                              placeholder="Confirm new password"
                              className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border pr-10 ${
                                  errors.confirmPassword && errors.confirmPassword.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                              } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                          />
                          <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {showConfirmPassword ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543-7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              ) : (
                                  <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </>
                              )}
                            </svg>
                          </button>
                          {renderFieldErrors('confirmPassword')}
                        </div>


                      </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className={`w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl ${
                        loading || !isFormValid() ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] transform'
                    }`}
                >
                  {loading ? (
                      <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                        {step === 'request' ? 'Sending Reset Code...' : 'Resetting Password...'}
                  </span>
                  ) : (
                      step === 'request' ? 'Send Reset Code' : 'Reset Password'
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                      type="button"
                      onClick={() => router.push('/Registration/login')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-semibold"
                  >
                    Back to <span className="text-orange-500 hover:underline">Sign In</span>
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