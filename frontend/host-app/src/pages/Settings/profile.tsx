import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserProfile } from '../../services/UserService';

export default function Profile() {
  const { user, token, setUser, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logo, setLogo] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<string>('');
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  // 1. Add state near other fields
  const [slug, setSlug] = useState('');

  const [errors, setErrors] = useState<{
    name?: string[];
    password?: string[];
    confirmPassword?: string[];
    storeName?: string[];
    logo?: string[];
    storeLogo?: string[];
    phoneNumber?: string[];
    address?: string[];
    general?: string[];
  }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeLogoInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string>(''); // New state for user ID

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    if (user) {
      setName(user?.name || '');
      setEmail(user?.email || '');
      setLogo(user?.logoUrl || '');
      setStoreName(user?.store_name || '');
      setStoreLogo(user?.store_logo || '');
      setPhoneNumber(user?.phone_number || '');
      setAddress(user?.address || '');
      setUserId(user?.id || ''); // Set the user ID from user object
      setSlug(user?.slug || '');

    }
  }, [user]);

  const fetchProfile = async (retryCount = 1) => {
    if (!token) {
      setErrors({ general: ['No authentication token'] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch profile');

      // Extract user data from the nested response structure
      const userData = data.data?.data?.user || {};
      console.log('Fetched user data:', userData);

      // Set the user data including the ID
      setUser({
        ...userData,
        id: userData.id || userData._id // Handle both id and _id cases
      });
      setUserId(userData.id || userData._id || ''); // Also store ID separately
    } catch (err) {
      console.error('Fetch profile error:', err);
      setErrors({ general: [(err as Error).message || 'Failed to fetch profile'] });
      if (retryCount > 0) {
        return setTimeout(() => fetchProfile(retryCount - 1), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const prepareRequestData = (field: string, value: string | File | null) => {
    // For file uploads, we'll use FormData
    if (value instanceof File) {
      const formData = new FormData();
      if (user?.user_type === 'worker' && userId) {
        formData.append('_id', userId);
      }
      formData.append(field, value);
      return {
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let the browser set it with boundary
        }
      };
    }

    // For regular fields, send as JSON
    const payload: Record<string, any> = {
      [field]: typeof value === 'string' ? value.trim() : value
    };

    // Include _id for worker users
    if (user?.user_type === 'worker' && userId) {
      payload._id = userId;
    }

    return {
      body: JSON.stringify(payload),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };


  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const validateName = (value: string): string[] => {
    const errors: string[] = [];
    if (!value.trim()) errors.push('Name is required');
    else if (value.length < 2) errors.push('Name must be at least 2 characters');
    return errors;
  };

  const validateStoreName = (value: string): string[] => {
    const errors: string[] = [];
    if (!value.trim()) errors.push('Store name is required');
    else if (value.length < 3) errors.push('Store name must be at least 3 characters');
    return errors;
  };

  const validatePhoneNumber = (value: string): string[] => {
    if (!value.trim()) return [];
    const errors: string[] = [];
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,6}$/;
    if (!phoneRegex.test(value)) errors.push('Please enter a valid phone number');
    return errors;
  };

  const validateSlug = (value: string): string[] => {
    const errors: string[] = [];
    if (!value.trim()) errors.push('Slug is required');
    else if (value.length < 2) errors.push('Slug must be at least 2 characters');
    else if (!/^[a-z0-9-]+$/.test(value)) errors.push('Slug must contain only lowercase letters, numbers, or dashes');
    return errors;
  };

  const validateAddress = (value: string): string[] => {
    if (!value.trim()) return [];
    const errors: string[] = [];
    if (value.length < 5) errors.push('Store address must be at least 5 characters');
    return errors;
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (!pwd.trim()) errors.push('Password is required');
    else {
      if (pwd.length < 8) errors.push('Password must be at least 8 characters');
      if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least 1 capital letter');
      if (!/\d/.test(pwd)) errors.push('Password must contain at least 1 number');
    }
    return errors;
  };

  const validateConfirmPassword = (confirmPwd: string, pwd: string): string[] => {
    const errors: string[] = [];
    if (!confirmPwd.trim()) errors.push('Please confirm your password');
    else if (confirmPwd !== pwd) errors.push('Passwords do not match');
    return errors;
  };

  const validateLogo = (file: File | null): string[] => {
    if (!file) return [];
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) errors.push('Please select a valid image file (JPEG, PNG, GIF, WebP)');
    if (file.size > 5 * 1024 * 1024) errors.push('Image size must be less than 5MB');
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'name': return validateName(name);
      case 'storeName': return validateStoreName(storeName);
      case 'phoneNumber': return validatePhoneNumber(phoneNumber);
      case 'address': return validateAddress(address);
      case 'password': return validatePassword(password);
      case 'confirmPassword': return validateConfirmPassword(confirmPassword, password);
      case 'logo': return validateLogo(logoFile);
      case 'storeLogo': return validateLogo(storeLogoFile);
      default: return [];
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'name') setName(value);
    if (field === 'storeName') setStoreName(value);
    if (field === 'phoneNumber') setPhoneNumber(value);
    if (field === 'address') setAddress(value);
    if (field === 'password') setPassword(value);
    if (field === 'slug') setSlug(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    setErrors(prev => ({ ...prev, [field]: getFieldErrors(field) }));
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setErrors(prev => ({ ...prev, [fieldName]: getFieldErrors(fieldName) }));
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName] || [];
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
  const getApiEndpoint = () => {
    return user?.user_type === 'isadmin'
      ? `${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/admin-profile`
      : `${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/profile`;
  };

  const prepareFormData = (field: string, value: string | File | null): FormData => {
    const formData = new FormData();

    // Always include _id for worker users
    if (user?.user_type === 'worker' && userId) {
      formData.append('_id', userId);
    }

    if (value !== null) {
      if (typeof value === 'string') {
        formData.append(field, value.trim());
      } else {
        formData.append(field, value);
      }
    }

    return formData;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const logoErrors = validateLogo(file);
      setErrors(prev => ({ ...prev, logo: logoErrors }));
      setLogoFile(file);
      setLogo(URL.createObjectURL(file));
      setTouchedFields(prev => new Set(prev).add('logo'));
    }
  };

  const handleSlugSave = async () => {
    if (!token || !slug.trim()) return;

    const slugErrors = validateSlug(slug);
    setErrors(prev => ({ ...prev, slug: slugErrors }));
    if (slugErrors.length > 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('slug', slug.trim());

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update slug');

      const updatedUser = { ...user, slug: slug.trim() };
      setUser(updatedUser);
      setEditingField(null);
      setErrors(prev => ({ ...prev, slug: [] }));
      showSuccess('Slug updated successfully');
    } catch (err) {
      console.error('Update slug error:', err);
      setErrors(prev => ({ ...prev, slug: [(err as Error).message || 'Failed to update slug'] }));
    } finally {
      setLoading(false);
    }
  };


  const handleStoreLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const logoErrors = validateLogo(file);
      setErrors(prev => ({ ...prev, storeLogo: logoErrors }));
      setStoreLogoFile(file);
      setStoreLogo(URL.createObjectURL(file));
      setTouchedFields(prev => new Set(prev).add('storeLogo'));
    }
  };

  // ... (other imports and code remain unchanged)
  const handlePasswordSave = async () => {
    if (!token) {
      setErrors(prev => ({ ...prev, password: ['No authentication token'] }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: ['Password is required'] }));
      return;
    }

    const passwordErrors = validatePassword(password);
    const confirmPasswordErrors = validateConfirmPassword(confirmPassword, password);
    setErrors(prev => ({ ...prev, password: passwordErrors, confirmPassword: confirmPasswordErrors }));
    if (passwordErrors.length > 0 || confirmPasswordErrors.length > 0) return;

    setLoading(true);
    try {
      const requestData = prepareRequestData('password', password);

      console.log('Updating password with payload:', {
        _id: userId,
        password
      });

      const response = await fetch(getApiEndpoint(), {
        method: 'PUT',
        ...requestData
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update password');

      const updatedUser = { ...user };
      setUser(updatedUser);
      setPassword('');
      setConfirmPassword('');
      setEditingField(null);
      setErrors(prev => ({ ...prev, password: [], confirmPassword: [] }));
      showSuccess('Password updated successfully');
    } catch (err) {
      console.error('Update password error:', err);
      setErrors(prev => ({
        ...prev,
        password: [(err as Error).message || 'Failed to update password']
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSave = async () => {
    if (!token) {
      setErrors(prev => ({ ...prev, logo: ['No authentication token'] }));
      return;
    }
    if (!logoFile) {
      setErrors(prev => ({ ...prev, logo: ['No logo file selected'] }));
      return;
    }

    const logoErrors = validateLogo(logoFile);
    setErrors(prev => ({ ...prev, logo: logoErrors }));
    if (logoErrors.length > 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      // Add _id for worker users
      if (user?.user_type === 'worker' && userId) {
        formData.append('_id', userId);
      }

      console.log('Updating logo with form data:', {
        _id: userId,
        hasFile: !!logoFile,
        userType: user?.user_type
      });

      const response = await fetch(getApiEndpoint(), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update logo');

      const updatedUser = {
        ...user,
        logoUrl: data.data?.logoUrl || logo
      };
      setUser(updatedUser);
      setLogoFile(null);
      setErrors(prev => ({ ...prev, logo: [] }));
      showSuccess('Profile photo updated successfully');
    } catch (err) {
      console.error('Update logo error:', err);
      setErrors(prev => ({
        ...prev,
        logo: [(err as Error).message || 'Failed to update logo']
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleNameSave = async () => {
    if (!token) {
      setErrors(prev => ({ ...prev, name: ['No authentication token'] }));
      return;
    }
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: ['Name is required'] }));
      return;
    }

    const nameErrors = validateName(name);
    setErrors(prev => ({ ...prev, name: nameErrors }));
    if (nameErrors.length > 0) return;

    setLoading(true);
    try {
      const requestData = prepareRequestData('name', name);

      console.log('Saving name with payload:', {
        _id: userId,
        name: name.trim()
      });

      const response = await fetch(getApiEndpoint(), {
        method: 'PUT',
        ...requestData
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update name');

      const updatedUser = { ...user, name: name.trim() };
      setUser(updatedUser);
      setEditingField(null);
      setErrors(prev => ({ ...prev, name: [] }));
      showSuccess('Name updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      setErrors(prev => ({ ...prev, name: [(err as Error).message || 'Failed to update name'] }));
    } finally {
      setLoading(false);
    }
  };

  const handleStoreLogoSave = async () => {
    if (!token || !storeLogoFile) return;
    const logoErrors = validateLogo(storeLogoFile);
    setErrors(prev => ({ ...prev, storeLogo: logoErrors }));
    if (logoErrors.length > 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('store_logo', storeLogoFile);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update store logo');
      const updatedUser = { ...user, store_logo: data.data?.store_logo || storeLogo };
      setUser(updatedUser);
      setStoreLogoFile(null);
      setErrors(prev => ({ ...prev, storeLogo: [] }));
      showSuccess('Store logo updated successfully');
    } catch (err) {
      console.error('Update store logo error:', err);
      setErrors(prev => ({ ...prev, storeLogo: [(err as Error).message || 'Failed to update store logo'] }));
    } finally {
      setLoading(false);
    }
  };

  const handleStoreNameSave = async () => {
    if (!token || !storeName.trim()) return;
    const storeNameErrors = validateStoreName(storeName);
    setErrors(prev => ({ ...prev, storeName: storeNameErrors }));
    if (storeNameErrors.length > 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('store_name', storeName.trim());
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update store name');
      const updatedUser = { ...user, store_name: storeName.trim() };
      setUser(updatedUser);
      setEditingField(null);
      setErrors(prev => ({ ...prev, storeName: [] }));
      showSuccess('Store name updated successfully');
    } catch (err) {
      console.error('Update store name error:', err);
      setErrors(prev => ({ ...prev, storeName: [(err as Error).message || 'Failed to update store name'] }));
    } finally {
      setLoading(false);
    }
  };
  const handleAddressSave = async () => {
    if (!token) return;
    const addressErrors = validateAddress(address);
    setErrors(prev => ({ ...prev, address: addressErrors }));
    if (addressErrors.length > 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('address', address.trim() || '');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update address');
      const updatedUser = { ...user, address: address.trim() || '' };
      setUser(updatedUser);
      setEditingField(null);
      setErrors(prev => ({ ...prev, address: [] }));
      showSuccess('Address updated successfully');
    } catch (err) {
      console.error('Update address error:', err);
      setErrors(prev => ({ ...prev, address: [(err as Error).message || 'Failed to update address'] }));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneNumberSave = async () => {
    if (!token) return;
    const phoneErrors = validatePhoneNumber(phoneNumber);
    setErrors(prev => ({ ...prev, phoneNumber: phoneErrors }));
    if (phoneErrors.length > 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone_number', phoneNumber.trim() || '');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update store contact number');
      const updatedUser = { ...user, phone_number: phoneNumber.trim() || '' };
      setUser(updatedUser);
      setEditingField(null);
      setErrors(prev => ({ ...prev, phoneNumber: [] }));
      showSuccess('Store contact number updated successfully');
    } catch (err) {
      console.error('Update store contact number error:', err);
      setErrors(prev => ({ ...prev, phoneNumber: [(err as Error).message || 'Failed to update store contact number'] }));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background-color)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary-color)] border-t-transparent mb-4"></div>
        <p className="text-[var(--text-secondary)]">Loading profile...</p>
      </div>
    );
  }
  const isAdmin = user?.user_type === 'isadmin';

  return (
    <div className="min-h-screen bg-[var(--background-color)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Hidden input for user ID */}
        <input type="hidden" name="_id" value={userId} />
        {/* Header */}
        <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] mb-8 overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[var(--surface-color)]">
                  <img src={logo || '/file.svg'} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  className="absolute -bottom-1 -right-1 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white rounded-full p-2 shadow-lg transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change photo"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 sm:mt-0 flex-1">
                <h1 className="text-2xl font-bold text-[var(--text-color)]">{name || 'Admin User'}</h1>
                <p className="text-[var(--text-secondary)]">{email || 'admin@rasant.com'}</p>
                {logoFile && (
                  <div>
                    <button
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                      onClick={handleLogoSave}
                      disabled={loading || errors.logo?.length > 0}
                    >
                      {loading ? 'Saving...' : 'Save Photo'}
                    </button>
                    {renderFieldErrors('logo')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* General Errors */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{errors.general[0]}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-color)]">Profile Settings</h2>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {/* Name Field */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-color)]">Full Name</label>
                {editingField !== 'name' && (
                  <button
                    onClick={() => setEditingField('name')}
                    className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingField === 'name' ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur('name')}
                    className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                      touchedFields.has('name') && errors.name?.length > 0
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-[var(--border-color)]'
                    } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                    placeholder="Enter your name"
                  />
                  {renderFieldErrors('name')}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleNameSave}
                      disabled={loading || errors.name?.length > 0}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null);
                        setName(user?.name || '');
                        setErrors(prev => ({ ...prev, name: [] }));
                      }}
                      className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[var(--text-color)]">{name || 'Not set'}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="px-6 py-6">
              <label className="text-sm font-medium text-[var(--text-color)] block mb-2">Email Address</label>
              <p className="text-[var(--text-color)]">{email || 'admin@rasant.com'}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Contact support to change your email address</p>
            </div>

            {/* Password Field */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-color)]">Password</label>
                {editingField !== 'password' && (
                  <button
                    onClick={() => setEditingField('password')}
                    className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                  >
                    Change
                  </button>
                )}
              </div>
              {editingField === 'password' ? (
                <div className="space-y-3">
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                        touchedFields.has('password') && errors.password?.length > 0
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-[var(--border-color)]'
                      } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                      placeholder="Enter new password"
                    />
                    {renderFieldErrors('password')}
                  </div>
                  <div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                        touchedFields.has('confirmPassword') && errors.confirmPassword?.length > 0
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-[var(--border-color)]'
                      } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                      placeholder="Confirm new password"
                    />
                    {renderFieldErrors('confirmPassword')}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] space-y-1">
                    <p>Password must contain:</p>
                    <ul className="ml-3 space-y-1">
                      <li className={password ? (validatePassword(password).length === 0 ? 'text-green-600' : 'text-red-600') : 'text-[var(--text-secondary)]'}>
                        • At least 8 characters
                      </li>
                      <li className={password ? (validatePassword(password).length === 0 ? 'text-green-600' : 'text-red-600') : 'text-[var(--text-secondary)]'}>
                        • 1 capital letter
                      </li>
                      <li className={password ? (validatePassword(password).length === 0 ? 'text-green-600' : 'text-red-600') : 'text-[var(--text-secondary)]'}>
                        • 1 number
                      </li>
                    </ul>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordSave}
                      disabled={loading || errors.password?.length > 0 || errors.confirmPassword?.length > 0}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null);
                        setPassword('');
                        setConfirmPassword('');
                        setErrors(prev => ({ ...prev, password: [], confirmPassword: [] }));
                      }}
                      className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[var(--text-color)]">••••••••</p>
              )}
            </div>

            {/* Store Name Field */}
            {isAdmin && (
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-color)]">Store Name</label>
                  {editingField !== 'storeName' && (
                    <button
                      onClick={() => setEditingField('storeName')}
                      className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'storeName' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      onFocus={() => handleFocus('storeName')}
                      onBlur={() => handleBlur('storeName')}
                      className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                        touchedFields.has('storeName') && errors.storeName?.length > 0
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-[var(--border-color)]'
                      } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                      placeholder="Enter store name"
                    />
                    {renderFieldErrors('storeName')}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleStoreNameSave}
                        disabled={loading || errors.storeName?.length > 0}
                        className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(null);
                          setStoreName(user?.store_name || '');
                          setErrors(prev => ({ ...prev, storeName: [] }));
                        }}
                        className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-color)]">{storeName || 'Not set'}</p>
                )}
              </div>
            )}

            {/* Slug Field */}
            {isAdmin && (
                <div className="px-6 py-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--text-color)]">Store Slug</label>
                    {editingField !== 'slug' && (
                        <button
                            onClick={() => setEditingField('slug')}
                            className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                        >
                          Edit
                        </button>
                    )}
                  </div>
                  {editingField === 'slug' ? (
                      <div className="space-y-3">
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => handleInputChange('slug', e.target.value)}
                            onFocus={() => handleFocus('slug')}
                            onBlur={() => handleBlur('slug')}
                            className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                                touchedFields.has('slug') && errors.slug?.length > 0
                                    ? 'border-red-500 ring-1 ring-red-500'
                                    : 'border-[var(--border-color)]'
                            } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                            placeholder="Enter store slug"
                        />
                        {renderFieldErrors('slug')}
                        <div className="flex space-x-3">
                          <button
                              onClick={handleSlugSave}
                              disabled={loading || errors.slug?.length > 0}
                              className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                              onClick={() => {
                                setEditingField(null);
                                setSlug(user?.slug || '');
                                setErrors(prev => ({ ...prev, slug: [] }));
                              }}
                              className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                  ) : (
                      <p className="text-[var(--text-color)]">{slug || 'Not set'}</p>
                  )}
                </div>
            )}

            {/* Store Logo Field */}
            {isAdmin && (
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-color)]">Store Logo</label>
                  {editingField !== 'storeLogo' && (
                    <button
                      onClick={() => setEditingField('storeLogo')}
                      className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                    >
                      Change
                    </button>
                  )}
                </div>
                {editingField === 'storeLogo' ? (
                  <div className="space-y-3">
                    <div className="relative w-24 h-24 rounded-lg border-2 border-[var(--border-color)] overflow-hidden bg-[var(--surface-color)]">
                      <img
                        src={storeLogo || '/file.svg'}
                        alt="Store Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <input
                      ref={storeLogoInputRef}
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-[var(--text-color)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--primary-color)]/10 file:text-[var(--primary-color)] hover:file:bg-[var(--primary-hover)]/10"
                      onChange={handleStoreLogoChange}
                    />
                    {renderFieldErrors('storeLogo')}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleStoreLogoSave}
                        disabled={loading || errors.storeLogo?.length > 0}
                        className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save Store Logo'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(null);
                          setStoreLogoFile(null);
                          setStoreLogo(user?.store_logo || '');
                          setErrors(prev => ({ ...prev, storeLogo: [] }));
                        }}
                        className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-[var(--border-color)] overflow-hidden bg-[var(--surface-color)]">
                    <img
                      src={storeLogo || '/file.svg'}
                      alt="Store Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Store Contact Number Field */}
            {isAdmin && (
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-color)]">Store Contact Number</label>
                  {editingField !== 'phoneNumber' && (
                    <button
                      onClick={() => setEditingField('phoneNumber')}
                      className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'phoneNumber' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      onFocus={() => handleFocus('phoneNumber')}
                      onBlur={() => handleBlur('phoneNumber')}
                      className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                        touchedFields.has('phoneNumber') && errors.phoneNumber?.length > 0
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-[var(--border-color)]'
                      } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                      placeholder="Enter store contact number"
                    />
                    {renderFieldErrors('phoneNumber')}
                    <div className="flex space-x-3">
                      <button
                        onClick={handlePhoneNumberSave}
                        disabled={loading || errors.phoneNumber?.length > 0}
                        className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(null);
                          setPhoneNumber(user?.phone_number || '');
                          setErrors(prev => ({ ...prev, phoneNumber: [] }));
                        }}
                        className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-color)]">{phoneNumber || 'Not set'}</p>
                )}
              </div>
            )}

            {/* Store Address Field */}
            {isAdmin && (
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[var(--text-color)]">Store Address</label>
                  {editingField !== 'address' && (
                    <button
                      onClick={() => setEditingField('address')}
                      className="text-sm text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingField === 'address' ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      onFocus={() => handleFocus('address')}
                      onBlur={() => handleBlur('address')}
                      className={`block w-full px-3 py-2 rounded-lg bg-[var(--surface-color)] text-[var(--text-color)] border ${
                        touchedFields.has('address') && errors.address?.length > 0
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-[var(--border-color)]'
                      } focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm`}
                      placeholder="Enter store address"
                    />
                    {renderFieldErrors('address')}
                    <div className="flex space-x-3">
                      <button
                        onClick={handleAddressSave}
                        disabled={loading || errors.address?.length > 0}
                        className="px-4 py-2 bg-[var(--primary-color)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingField(null);
                          setAddress(user?.address || '');
                          setErrors(prev => ({ ...prev, address: [] }));
                        }}
                        className="px-4 py-2 bg-[var(--surface-color)] text-[var(--text-color)] text-sm font-medium rounded-lg hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-color)] transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-color)]">{address || 'Not set'}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
