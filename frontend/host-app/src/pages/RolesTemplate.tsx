import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { fetchRoles, createRole, deleteRole } from '../services/RoleService';

interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface RolesTemplateProps {
  token: string | null;
  logout: () => void;
}

const RolesTemplate: React.FC<RolesTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({ fetch: false, create: false, delete: false });

  useEffect(() => {
    if (token) {
      setIsLoading((prev) => ({ ...prev, fetch: true }));
      fetchRoles(token, logout)
        .then(setRoles)
        .catch((error) => showMessage(error.message, false))
        .finally(() => setIsLoading((prev) => ({ ...prev, fetch: false })));
    }
  }, [token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (msg: string, success: boolean) => {
    setMessage(msg);
    setIsSuccess(success);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      showMessage('Role name cannot be empty!', false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const newRole = await createRole(token!, logout, newRoleName);
      setRoles([...roles, newRole]);
      setNewRoleName('');
      showMessage('Role created successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to create role', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await deleteRole(token!, logout, roleId);
      setRoles(roles.filter((role) => role._id !== roleId));
      showMessage('Role deleted successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to delete role', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage Roles</h2>

      {/* Create Role Form */}
      <details className="mb-6">
        <summary className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer">Create New Role</summary>
        <form onSubmit={handleCreateRole} className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:space-x-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                placeholder="Enter role name"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:self-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-indigo-300"
                disabled={isLoading.create}
              >
                {isLoading.create ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </form>
      </details>

      {/* Roles List */}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Existing Roles</h3>
      {isLoading.fetch ? (
        <div className="animate-pulse space-y-2">
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No roles found</p>
      ) : (
        <ul className="space-y-2">
          {roles.map((role) => (
            <li
              key={role._id}
              className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 text-sm"
            >
              <span>{role.name}</span>
              <button
                onClick={() => handleDeleteRole(role._id)}
                className="text-red-600 hover:text-red-800 disabled:opacity-50"
                disabled={isLoading.delete}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-xl text-sm flex items-center space-x-3 ${isSuccess ? 'bg-green-600 dark:bg-green-700 text-white' : 'bg-red-600 dark:bg-red-700 text-white'}`}>
          {isSuccess ? <CheckCircleIcon className="w-6 h-6" /> : <ExclamationCircleIcon className="w-6 h-6" />}
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="hover:opacity-80">✕</button>
        </div>
      )}
    </div>
  );
};

export default RolesTemplate;
