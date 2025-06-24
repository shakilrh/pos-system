import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const API_ENDPOINT = 'http://192.168.18.107:3000/users/api/v1/admin-profile';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState<string>(user?.logoUrl || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch latest user info from API on mount or edit cancel
  const fetchProfile = async () => {
    try {
      const res = await fetch(API_ENDPOINT, { method: 'GET', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setName(data.name);
        setEmail(data.email);
        setLogo(data.logoUrl || '');
        setError(null);
        console.log('Profile fetched successfully:', data);
      } else {
        setError('Failed to fetch profile');
        console.error('Error fetching profile:', res.status, res.statusText);
      }
    } catch {
      setError('Failed to fetch profile');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogo(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (password) {
      formData.append('password', password);
    }
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      if (res.ok) {
        await fetchProfile();
        setEditMode(false);
        setPassword('');
        setLogoFile(null);
      } else {
        setError('Failed to update profile');
      }
    } catch {
      setError('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-2">
          <img
            src={logo || '/file.svg'}
            alt="Admin Logo"
            className="w-24 h-24 rounded-full border object-cover"
          />
          {editMode && (
            <button
              className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-1"
              onClick={() => fileInputRef.current?.click()}
              title="Change Logo"
              type="button"
            >
              ✎
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>
      {editMode ? (
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full p-2 border rounded"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full p-2 border rounded"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              className="w-full p-2 border rounded"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              onClick={async () => {
                setEditMode(false);
                setPassword('');
                setLogoFile(null);
                await fetchProfile();
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <p className="text-lg">Name: {user?.name || 'Admin'}</p>
          <p className="text-lg">Email: {user?.email || 'admin@rasant.com'}</p>
          <button
            className="mt-4 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            onClick={() => setEditMode(true)}
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}