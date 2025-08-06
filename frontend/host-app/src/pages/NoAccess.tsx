import React from 'react';
import { useRouter } from 'next/navigation';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function NoAccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <LockClosedIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          You do not have permission to access this page. Please contact your administrator for assistance.
        </p>
        <button
          onClick={() => router.push('/Dashboard/dashboard')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
//test