import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <div className="mt-4">
        <p className="text-lg">Name: {user?.name || 'Admin'}</p>
        <p className="text-lg">Email: {user?.email || 'admin@rasant.com'}</p>
        <p className="text-lg">Role: {user?.role || 'Administrator'}</p>
      </div>
    </div>
  );
}