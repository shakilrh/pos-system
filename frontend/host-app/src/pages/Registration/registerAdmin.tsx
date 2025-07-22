import React, { useState } from 'react';
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
    phoneNumber: '',
    address: ''
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    storeName?: string[];
    logo?: string[];
    phoneNumber?: string[];
    address?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Enhanced validation functions that return arrays of error messages
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

  const validatePhoneNumber = (phoneNumber: string): string[] => {
    if (!phoneNumber.trim()) return []; // Optional field
    const errors: string[] = [];
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) errors.push('Please enter a valid phone number (e.g., +1234567890)');
    return errors;
  };

  const validateAddress = (address: string): string[] => {
    if (!address.trim()) return []; // Optional field
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
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    const requiredFields = ['name', 'email', 'password', 'confirmPassword', 'storeName'];
    const requiredFieldsValid = requiredFields.every(field => getFieldErrors(field).length === 0);
    const optionalFieldsValid = ['phoneNumber', 'address'].every(field => getFieldErrors(field).length === 0);
    const logoValid = validateLogo(logo).length === 0;
    return requiredFieldsValid && optionalFieldsValid && logoValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (touchedFields.has(name)) {
      setErrors(prev => ({
        ...prev,
        [name]: getFieldErrors(name === 'confirmPassword' ? 'confirmPassword' : name)
      }));
    }
    if (name === 'password' && touchedFields.has('confirmPassword')) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
      }));
    }
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
    setErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName)
    }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['name', 'email', 'password', 'confirmPassword', 'storeName', 'phoneNumber', 'address'];
    setTouchedFields(new Set(allFields));
    const allErrors: any = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });
    allErrors.logo = validateLogo(logo);
    setErrors(allErrors);
    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);
    if (hasErrors) {
      setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await adminAuthService.registerAdmin(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        logo,
        formData.storeName.trim(),
        formData.phoneNumber.trim() || null,
        formData.address.trim() || null
      );
      setFlashMessage({ message: 'Admin registered successfully! Redirecting to login...', type: 'success' });
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        storeName: '',
        phoneNumber: '',
        address: ''
      });
      setLogo(null);
      setErrors({});
      setTouchedFields(new Set());
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setFlashMessage({
        message: error.message || 'Failed to register admin. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="flex w-full max-w-6xl h-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
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

        <div className="w-1/2 p-8 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Create Admin Account</h2>
            {flashMessage && (
              <FlashMessage
                message={flashMessage.message}
                type={flashMessage.type}
                onClose={() => setFlashMessage(null)}
                className="mb-4"
              />
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
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
                    className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                      errors.name && errors.name.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                  />
                  {renderFieldErrors('name')}
                </div>
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
                    className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                      errors.email && errors.email.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                  />
                  {renderFieldErrors('email')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    placeholder="Enter password"
                    className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                      errors.password && errors.password.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                  />
                  {renderFieldErrors('password')}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('confirmPassword')}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Confirm password"
                    className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                      errors.confirmPassword && errors.confirmPassword.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                  />
                  {renderFieldErrors('confirmPassword')}
                </div>
              </div>

              <div>
                <label htmlFor="storeName" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
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
                  className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                    errors.storeName && errors.storeName.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                  } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                />
                {renderFieldErrors('storeName')}
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('phoneNumber')}
                  onBlur={() => handleBlur('phoneNumber')}
                  placeholder="+1234567890"
                  className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                    errors.phoneNumber && errors.phoneNumber.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                  } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                />
                {renderFieldErrors('phoneNumber')}
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Address (Optional)
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus('address')}
                  onBlur={() => handleBlur('address')}
                  placeholder="123 Main St, City, Country"
                  className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                    errors.address && errors.address.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                  } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm`}
                />
                {renderFieldErrors('address')}
              </div>

              <div>
                <label htmlFor="logo" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  Store Logo (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                    className={`w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border ${
                      errors.logo && errors.logo.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 dark:border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 dark:file:bg-gray-600 dark:file:text-gray-200`}
                  />
                </div>
                {renderFieldErrors('logo')}
                {logo && (!errors.logo || errors.logo.length === 0) && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {logo.name} ({(logo.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

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
                    Creating Account...
                  </span>
                ) : (
                  '🚀 Create Admin Account'
                )}
              </button>

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
