import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API_ENDPOINT = 'http://192.168.18.107:3000/users/api/v1/admin-profile';
const DETAILS_API = 'http://192.168.18.107:3000/users/api/v1/details';

export default function Profile() {
  const { user, token, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    } catch (err) {
      console.error('Update logo error:', err);
      setError(err.message || 'Failed to update logo');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSave = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('name', name);

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
    } catch (err) {
      console.error('Update name error:', err);
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!token || !password) return;
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
    } catch (err) {
      console.error('Update password error:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Profile</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="mb-8">
        <div className="relative w-32 h-32 mb-4">
          <img
            src={logo || '/file.svg'}
            alt="Admin Logo"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <button
            className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Logo"
          >
            ↑
          </button>
          {logoFile && (
            <button
              className="ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={handleLogoSave}
              disabled={loading}
            >
              Save Logo
            </button>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Name</h2>
          <div className="flex justify-between items-center">
            <input
              className="w-full max-w-md p-2 border border-gray-300 rounded"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <button
              className="ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={handleNameSave}
              disabled={loading}
            >
              Save
            </button>
          </div>
        </div>
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Contacts</h2>
          <p className="text-lg text-gray-900">Email: {email || 'admin@rasant.com'}</p>
        </div>
        <div className="border-b pb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">New Password</h2>
          <div className="flex justify-between items-center">
            <input
              className="w-full max-w-md p-2 border border-gray-300 rounded"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
            <button
              className="ml-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={handlePasswordSave}
              disabled={loading || !password}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}