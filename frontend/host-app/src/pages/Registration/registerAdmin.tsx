





import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAuthService } from '../../services/adminAuthService';
import FlashMessage from '../FlashMessage';


export default function RegisterAdmin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    slug: '',
    phoneNumber: '',
    address: ''
  });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation functions
  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Name is required');
    } else {
      if (name.length < 2) errors.push('Name must be at least 2 characters long');
      if (name.length > 50) errors.push('Name must be less than 50 characters');
      if (!/^[A-Za-z\s'-]+$/.test(name)) errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
      if (/^\s|\s$/.test(name)) errors.push('Name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (!email.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
      if (email.length > 254) errors.push('Email address is too long');
      if (email.includes('..')) errors.push('Email cannot contain consecutive dots');
    }
    return errors;
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (!password.trim()) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) errors.push('Password must be at least 8 characters long');
      if (password.length > 128) errors.push('Password must be less than 128 characters');
      if (!/[A-Z]/.test(password)) errors.push('Password must include at least one uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('Password must include at least one lowercase letter');
      if (!/[0-9]/.test(password)) errors.push('Password must include at least one number');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must include at least one special character');
      }
      if (/\s/.test(password)) errors.push('Password cannot contain spaces');
      if (/(.)\1{2,}/.test(password)) errors.push('Password cannot contain more than 2 consecutive identical characters');
    }
    return errors;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string[] => {
    const errors: string[] = [];
    if (!confirmPassword.trim()) {
      errors.push('Please confirm your password');
    } else if (confirmPassword !== password) {
      errors.push('Passwords do not match');
    }
    return errors;
  };

  const validateStoreName = (storeName: string): string[] => {
    const errors: string[] = [];
    if (!storeName.trim()) {
      errors.push('Store name is required');
    } else {
      if (storeName.length < 3) errors.push('Store name must be at least 3 characters long');
      if (storeName.length > 100) errors.push('Store name must be less than 100 characters');
      if (!/^[A-Za-z0-9\s&'-.,()]+$/.test(storeName)) {
        errors.push('Store name can only contain letters, numbers, spaces, and common punctuation');
      }
      if (/^\s|\s$/.test(storeName)) errors.push('Store name cannot start or end with spaces');
      if (/\s{2,}/.test(storeName)) errors.push('Store name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateSlug = (slug: string | undefined | null): string[] => {
    const errors: string[] = [];
    if (!slug || !slug.trim()) {
      errors.push('Store slug is required');
      return errors;
    }
    if (slug.length < 3) errors.push('Slug must be at least 3 characters long');
    if (slug.length > 50) errors.push('Slug must be less than 50 characters');
    if (!/^[a-z0-9-]+$/.test(slug)) errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
    if (/^-|-$/.test(slug)) errors.push('Slug cannot start or end with a hyphen');
    if (/--/.test(slug)) errors.push('Slug cannot contain consecutive hyphens');
    if (/\s/.test(slug)) errors.push('Slug cannot contain spaces');
    return errors;
  };

  const validatePhoneNumber = (phoneNumber: string): string[] => {
    if (!phoneNumber.trim()) return [];
    const errors: string[] = [];
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,6}$/;
    if (!phoneRegex.test(phoneNumber)) errors.push('Please enter a valid phone number (e.g., +1234567890, (123) 456-7890)');
    return errors;
  };

  const validateAddress = (address: string): string[] => {
    if (!address.trim()) return [];
    const errors: string[] = [];
    if (address.length < 5) errors.push('Address must be at least 5 characters long');
    if (address.length > 200) errors.push('Address must be less than 200 characters');
    return errors;
  };

  const validateLogo = (file: File | null): string[] => {
    if (!file) return [];
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Please select a valid image file (JPEG, PNG, GIF, WebP)');
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) errors.push('Image size should be less than 5MB');
    const minSize = 1024; // 1KB minimum
    if (file.size < minSize) errors.push('Image file is too small (minimum 1KB)');
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'name':
        return validateName(formData.name);
      case 'email':
        return validateEmail(formData.email);
      case 'password':
        return validatePassword(formData.password);
      case 'confirmPassword':
        return validateConfirmPassword(formData.confirmPassword, formData.password);
      case 'storeName':
        return validateStoreName(formData.storeName);
      case 'phoneNumber':
        return validatePhoneNumber(formData.phoneNumber);
      case 'address':
        return validateAddress(formData.address);
      case 'logo':
        return validateLogo(logo);
      case 'slug':
        return validateSlug(formData.slug);
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    const requiredFields = ['name', 'email', 'password', 'confirmPassword', 'storeName', 'slug'];
    const requiredFieldsValid = requiredFields.every(field => getFieldErrors(field).length === 0);
    const optionalFieldsValid = ['phoneNumber', 'address'].every(field => getFieldErrors(field).length === 0);
    const logoValid = validateLogo(logo).length === 0;
    return requiredFieldsValid && optionalFieldsValid && logoValid;
  };

  useEffect(() => {
    const allFields = ['name', 'email', 'password', 'confirmPassword', 'storeName', 'phoneNumber', 'address', 'logo', 'slug'];
    const newErrors: any = {};
    allFields.forEach(field => {
      newErrors[field] = getFieldErrors(field);
    });
    setErrors(newErrors);
  }, [formData, logo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setTouchedFields(prev => new Set(prev).add(name));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogo(file);
    if (file) {
      const logoErrors = validateLogo(file);
      setErrors(prev => ({ ...prev, logo: logoErrors }));
      if (logoErrors.length > 0) {
        setFlashMessage({ message: logoErrors[0], type: 'error' });
      } else {
        if (flashMessage?.type === 'error' && flashMessage.message.includes('Image')) {
          setFlashMessage(null);
        }
      }
    } else {
      setErrors(prev => ({ ...prev, logo: [] }));
      if (flashMessage?.type === 'error' && flashMessage.message.includes('Image')) {
        setFlashMessage(null);
      }
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['name', 'email', 'password', 'confirmPassword', 'storeName', 'phoneNumber', 'address', 'logo', 'slug'];
    setTouchedFields(new Set(allFields));
    const allErrors: any = {};

    try {
      allFields.forEach(field => {
        allErrors[field] = getFieldErrors(field);
      });
      setErrors(allErrors);

      const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);
      if (hasErrors) {
        setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
        return;
      }

      setLoading(true);
      setFlashMessage(null); // Clear any existing messages

      await adminAuthService.registerAdmin(
          formData.name.trim(),
          formData.email.trim(),
          formData.password,
          logo,
          formData.storeName.trim(),
          formData.phoneNumber.trim() || null,
          formData.address.trim() || null,
          formData.slug.trim() || null
      );

      setFlashMessage({
        message: 'Admin registered successfully!',
        type: 'success'
      });

      setTimeout(() => router.push('/Registration/login'), 2000);

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        storeName: '',
        phoneNumber: '',
        address: '',
        slug: ''
      });
      setLogo(null);
      setErrors({});
      setTouchedFields(new Set());

    } catch (error: any) {
      console.error('Full Registration error object:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);

      let errorMessage = 'Failed to register admin. Please try again.';

      // Handle different error structures
      if (error.response?.data) {
        const data = error.response.data;

        // Your API returns error in the 'message' field
        if (data.message) {
          errorMessage = data.message;
        }
        // Fallback to other possible error fields
        else if (data.error) {
          errorMessage = data.error;
        }
        else if (data.errors) {
          // Handle validation errors array
          if (Array.isArray(data.errors)) {
            errorMessage = data.errors.join(', ');
          } else if (typeof data.errors === 'object') {
            // Handle object of field errors
            const errorMessages = Object.values(data.errors).flat();
            errorMessage = errorMessages.join(', ');
          } else {
            errorMessage = data.errors;
          }
        }
        // If data is just a string
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      // Handle network errors or other types of errors
      else if (error.message) {
        errorMessage = error.message;
      }

      console.log('Final error message to display:', errorMessage);

      // Force update the flash message
      setFlashMessage({
        message: errorMessage,
        type: 'error'
      });

      // Also force a re-render by updating a timestamp (optional debugging)
      console.log('Flash message set at:', new Date().toISOString());

    } finally {
      setLoading(false);
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0 || !touchedFields.has(fieldName)) return null;

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

        <div className="flex w-full max-w-7xl h-auto bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-3xl shadow-2xl overflow-hidden animate-fade-in relative z-10">
          <div className="w-1/2 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white p-8 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            <div className="relative z-10 text-center">
              <div className="text-7xl font-bold text-white mb-6 drop-shadow-lg animate-bounce">🍽️ Rasant</div>
              <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                Welcome to Admin Portal
              </h3>
              <p className="text-orange-100 text-lg leading-relaxed max-w-sm mb-6">
                Create your admin account and set up your restaurant's digital presence with our powerful management tools.
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

            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full -mr-20 -'){mb-20 animate-pulse"></div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mt-12 animate-pulse animation-delay-2000"></div>
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-white bg-opacity-10 rounded-full animate-pulse animation-delay-4000"></div>
          </div>

          <div className="w-1/2 p-8 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <div className="max-w-md mx-auto w-full">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  Create Admin Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Join thousands of successful restaurants</p>
              </div>

              {flashMessage && (
                  <FlashMessage
                      message={flashMessage.message}
                      type={flashMessage.type}
                      onClose={() => setFlashMessage(null)}
                      className="mb-6"
                  />
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus('name')}
                        onBlur={() => handleBlur('name')}
                        placeholder="John Doe"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                            touchedFields.has('name') && errors.name && errors.name.length > 0
                                ? 'border-red-400 ring-2 ring-red-200'
                                : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                    />
                    {renderFieldErrors('name')}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                        type="text"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus('email')}
                        onBlur={() => handleBlur('email')}
                        placeholder="john@example.com"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                            touchedFields.has('email') && errors.email && errors.email.length > 0
                                ? 'border-red-400 ring-2 ring-red-200'
                                : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                    />
                    {renderFieldErrors('email')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password *
                    </label>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus('password')}
                        onBlur={() => handleBlur('password')}
                        placeholder="Enter strong password"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 pr-12 ${
                            touchedFields.has('password') && errors.password && errors.password.length > 0
                                ? 'border-red-400 ring-2 ring-red-200'
                                : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
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
                    {renderFieldErrors('password')}
                  </div>
                  <div className="relative">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                        placeholder="Confirm password"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 pr-12 ${
                            touchedFields.has('confirmPassword') && errors.confirmPassword && errors.confirmPassword.length > 0
                                ? 'border-red-400 ring-2 ring-red-200'
                                : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-12 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showConfirmPassword ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Store/Restaurant Name *
                    </label>
                    <input
                        type="text"
                        id="storeName"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus('storeName')}
                        onBlur={() => handleBlur('storeName')}
                        placeholder="Amazing Restaurant & Cafe"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                            touchedFields.has('storeName') && errors.storeName && errors.storeName.length > 0
                                ? 'border-red-400 ring-2 ring-red-200'
                                : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                    />
                    {renderFieldErrors('storeName')}
                  </div>
                  <div>
                    <label htmlFor="slug" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Store Domain/Slug *
                    </label>
                    <div className="relative">
                      <input
                          type="text"
                          id="slug"
                          name="slug"
                          value={formData.slug}
                          onChange={handleInputChange}
                          onFocus={() => handleFocus('slug')}
                          onBlur={() => handleBlur('slug')}
                          placeholder="amazing-restaurant"
                          className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                              touchedFields.has('slug') && errors.slug && errors.slug.length > 0
                                  ? 'border-red-400 ring-2 ring-red-200'
                                  : 'border-gray-200 dark:border-gray-600'
                          } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                      />
                      {formData.slug && (
                          <div className="absolute right-3 top-3 text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                            .rasant.com
                          </div>
                      )}
                    </div>
                    {renderFieldErrors('slug')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                        type="text"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus('phoneNumber')}
                        placeholder="+1234567890 or (123) 456-7890"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                            errors.phoneNumber && errors.phoneNumber.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                    />
                    {renderFieldErrors('phoneNumber')}
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus('address')}
                        placeholder="123 Main St, City"
                        className={`w-full p-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 ${
                            errors.address && errors.address.length > 0 ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200`}
                    />
                    {renderFieldErrors('address')}
                  </div>
                </div>

                <div>
                  <label
                      htmlFor="logo"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Store Logo (Optional)
                  </label>

                  <div className="relative">
                    {/* Hide the actual input */}
                    <input
                        type="file"
                        id="logo"
                        name="logo"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleLogoChange}
                        className="hidden"
                    />

                    {/* Custom button with upload icon */}
                    <label
                        htmlFor="logo"
                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold cursor-pointer
        bg-gradient-to-r from-orange-50 to-red-50 text-orange-600 
        hover:from-orange-100 hover:to-red-100
        dark:bg-gray-600 dark:text-gray-200
        border-2 ${
                            errors.logo && errors.logo.length > 0
                                ? 'border-red-400 ring-2 ring-red-200'
                                : 'border-gray-200 dark:border-gray-600'
                        }
      `}
                    >
                      {/* Upload Icon */}
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0l-4 4m4-4l4 4"
                        />
                      </svg>
                      Upload Logo
                    </label>
                  </div>

                  {renderFieldErrors('logo')}

                  {logo && (!errors.logo || errors.logo.length === 0) && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-green-200 dark:border-gray-600">
                        <p className="text-sm text-green-700 dark:text-green-400 flex items-center">
                          <svg
                              className="w-4 h-4 mr-2"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                          >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium">{logo.name}</span>
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full">
          {(logo.size / 1024).toFixed(1)} KB
        </span>
                        </p>
                      </div>
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
                    Creating Your Account...
                  </span>
                  ) : (
                      <>

                        Create Admin Account

                      </>
                  )}
                </button>

                <div className="text-center pt-4">
                  <button
                      type="button"
                      onClick={() => router.push('/Registration/login')} // Updated path
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-200 font-semibold"
                  >
                    Already have an account?
                    <span className="text-gradient bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent hover:underline ml-1">
    Sign In →
  </span>
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



