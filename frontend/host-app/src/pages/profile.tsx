import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile } from '../services/UserService';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setLogo(user?.logoUrl || '');
    setStoreName(user?.store_name || '');
    setStoreLogo(user?.store_logo || '');
  }, [user]);

  const fetchProfile = async (retryCount = 1) => {
    if (!token) {
      setError('No authentication token');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userData = await fetchUserProfile(token, logout);
      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setLogo(userData.logoUrl || '');
      setStoreName(userData.store_name || '');
      setStoreLogo(userData.store_logo || '');
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.message || 'Failed to fetch profile');
      if (retryCount > 0) {
        console.warn(`Retrying fetchProfile, attempts left: ${retryCount}`);
        return setTimeout(() => fetchProfile(retryCount - 1), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleApiError = (response: any, field: string): string => {
    if (!response) {
      return `Failed to update ${field}: No response from server`;
    }
    if (typeof response === 'string') {
      return `Failed to update ${field}: ${response}`;
    }
    if (response.status === 401) {
      logout();
      return 'Please log in to continue';
    }
    if (!response.ok) {
      const message =
        response.message ||
        response.error ||
        (response.errors && Array.isArray(response.errors) ? response.errors.join(', ') : null) ||
        'An unexpected error occurred';
      return `Failed to update ${field}: ${message}`;
    }
    return `Failed to update ${field}: Unknown error`;
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      setLogo(URL.createObjectURL(file));
    }
  };

  const handleStoreLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Store logo size must be less than 5MB');
        return;
      }
      setStoreLogoFile(file);
      setStoreLogo(URL.createObjectURL(file));
    }
  };

  const handleLogoSave = async () => {
    if (!token || !logoFile || !user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Logo update response:', { status: response.status, headers: Object.fromEntries(response.headers), data });
      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data, 'logo'));
      }
      await fetchProfile();
      setLogoFile(null);
      showSuccess('Profile photo updated successfully');
    } catch (err) {
      console.error('Update logo error:', err);
      setError(err.message || 'Failed to update logo');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreLogoSave = async () => {
    if (!token || !storeLogoFile || !user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('store_logo', storeLogoFile);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Store logo update response:', { status: response.status, headers: Object.fromEntries(response.headers), data });
      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data, 'store logo'));
      }
      await fetchProfile();
      setStoreLogoFile(null);
      showSuccess('Store logo updated successfully');
    } catch (err) {
      console.error('Update store logo error:', err);
      setError(err.message || 'Failed to update store logo');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSave = async () => {
    if (!token || !name.trim() || !user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('_id', user._id);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Name update response:', { status: response.status, headers: Object.fromEntries(response.headers), data });
      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data, 'name'));
      }
      await fetchProfile();
      setEditingField(null);
      showSuccess('Name updated successfully');
    } catch (err) {
      console.error('Update name error:', err);
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreNameSave = async () => {
    if (!token || !storeName.trim() || !user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('store_name', storeName.trim());
      formData.append('_id', user._id);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Store name update response:', { status: response.status, headers: Object.fromEntries(response.headers), data });
      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data, 'store name'));
      }
      await fetchProfile();
      setEditingField(null);
      showSuccess('Store name updated successfully');
    } catch (err) {
      console.error('Update store name error:', err);
      setError(err.message || 'Failed to update store name');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasCapital = /[A-Z]/.test(pwd);
    const hasNumeric = /\d/.test(pwd);
    return { minLength, hasCapital, hasNumeric };
  };

  const handlePasswordSave = async () => {
    if (!token || !password || !user?._id) return;

    const validation = validatePassword(password);
    if (!validation.minLength) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!validation.hasCapital) {
      setError('Password must contain at least 1 capital letter');
      return;
    }
    if (!validation.hasNumeric) {
      setError('Password must contain at least 1 number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('password', password);
      formData.append('_id', user._id);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000'}/users/api/v1/admin-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log('Password update response:', { status: response.status, headers: Object.fromEntries(response.headers), data });
      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data, 'password'));
      }
      await fetchProfile();
      setPassword('');
      setConfirmPassword('');
      setEditingField(null);
      showSuccess('Password updated successfully');
    } catch (err) {
      console.error('Update password error:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                  <img
                    src={logo || '/file.svg'}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <button
                  className="absolute -bottom-1 -right-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-2 shadow-lg transition-colors"
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
                <h1 className="text-2xl font-bold text-gray-900">{name || 'Admin User'}</h1>
                <p className="text-gray-600">{email || 'admin@rasant.com'}</p>
                {logoFile && (
                  <button
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                    onClick={handleLogoSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Name Field */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                {editingField !== 'name' && (
                  <button
                    onClick={() => setEditingField('name')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
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
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your name"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleNameSave}
                      disabled={loading || !name.trim()}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null);
                        setName(user?.name || '');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900">{name || 'Not set'}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="px-6 py-6">
              <label className="text-sm font-medium text-gray-700 block mb-2">Email Address</label>
              <p className="text-gray-900">{email || 'admin@rasant.com'}</p>
              <p className="text-xs text-gray-500 mt-1">Contact support to change your email address</p>
            </div>

            {/* Password Field */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                {editingField !== 'password' && (
                  <button
                    onClick={() => setEditingField('password')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Change
                  </button>
                )}
              </div>
              {editingField === 'password' ? (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter new password"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Confirm new password"
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Password must contain:</p>
                    <ul className="ml-3 space-y-1">
                      <li className={password ? (validatePassword(password).minLength ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
                        • At least 8 characters
                      </li>
                      <li className={password ? (validatePassword(password).hasCapital ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
                        • 1 capital letter
                      </li>
                      <li className={password ? (validatePassword(password).hasNumeric ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
                        • 1 number
                      </li>
                    </ul>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordSave}
                      disabled={loading || !password || !confirmPassword}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null);
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900">••••••••</p>
              )}
            </div>

            {/* Store Name Field */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Store Name</label>
                {editingField !== 'storeName' && (
                  <button
                    onClick={() => setEditingField('storeName')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
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
                    onChange={(e) => setStoreName(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter store name"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleStoreNameSave}
                      disabled={loading || !storeName.trim()}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null);
                        setStoreName(user?.store_name || '');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900">{storeName || 'Not set'}</p>
              )}
            </div>

            {/* Store Logo Field */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Store Logo</label>
                {editingField !== 'storeLogo' && (
                  <button
                    onClick={() => setEditingField('storeLogo')}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Change
                  </button>
                )}
              </div>
              {editingField === 'storeLogo' ? (
                <div className="space-y-3">
                  <div className="relative w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-100">
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
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    onChange={handleStoreLogoChange}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleStoreLogoSave}
                      disabled={loading || !storeLogoFile}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save Store Logo'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingField(null);
                        setStoreLogoFile(null);
                        setStoreLogo(user?.store_logo || '');
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-100">
                  <img
                    src={storeLogo || '/file.svg'}
                    alt="Store Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}