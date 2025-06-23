import React from 'react';

export default function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-4">
        <p className="text-lg">Account Settings</p>
        <button className="mt-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
          Update Password
        </button>
      </div>
    </div>
  );
}