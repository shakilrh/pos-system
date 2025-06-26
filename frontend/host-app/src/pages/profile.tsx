import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API_ENDPOINT = 'http://192.168.18.107:3000/users/api/v1/admin-profile';
const DETAILS_API = 'http://192.168.18.107:3000/users/api/v1/details';

export default function Profile() {
  const { user, token, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logo, setLogo] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setLogo(user?.logoUrl || '');
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
      const res = await fetch(DETAILS_API, {
        method: 'GET',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (retryCount > 0) {
          console.warn(`Retrying fetchProfile, attempts left: ${retryCount}`);
          return setTimeout(() => fetchProfile(retryCount - 1), 1000);
        }
        throw new Error(`Failed to fetch profile: ${res.status} ${errorData.message || res.statusText}`);
      }
      const response = await res.json();
      const userData = response.data.data.user;
      setUser(userData);
      setName(userData.name || '');
      setEmail(userData.email || '');
      setLogo(userData.logoUrl || '');
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
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

  const handleLogoSave = async () => {
    if (!token || !logoFile) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to update logo: ${res.status} ${errorData.message || res.statusText}`);
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

  const handleNameSave = async () => {
    if (!token || !name.trim()) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('name', name.trim());

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to update name: ${res.status} ${errorData.message || res.statusText}`);
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

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasCapital = /[A-Z]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const hasNumeric = /\d/.test(pwd);
    return { minLength, hasCapital, hasSpecial, hasNumeric };
  };

  const handlePasswordSave = async () => {
    if (!token || !password) return;
    
    const validation = validatePassword(password);
    if (!validation.minLength) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!validation.hasCapital) {
      setError('Password must contain at least 1 capital letter');
      return;
    }
    if (!validation.hasSpecial) {
      setError('Password must contain at least 1 special character');
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
    const formData = new FormData();
    formData.append('password', password);

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to update password: ${res.status} ${errorData.message || res.statusText}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
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
                  className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors"
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
                    className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleNameSave}
                      disabled={loading || !name.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <li className={password ? (validatePassword(password).hasSpecial ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}>
                        • 1 special character (!@#$%^&*...)
                      </li>
                    </ul>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordSave}
                      disabled={loading || !password || !confirmPassword}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
          </div>
        </div>
      </div>
    </div>
  );
}