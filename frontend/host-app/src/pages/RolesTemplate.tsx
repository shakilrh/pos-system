import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

// Interfaces for type safety
interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: { data: Role[] } | Role;
  error?: string;
  details?: any;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchRoles();
    }
  }, [token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleApiError = (response: ApiResponse) => {
    if (!response.success) {
      console.error('API Error:', response);
      switch (response.error) {
        case 'DATA_NOT_FOUND':
          return 'Not Found';
        case 'BAD_REQUEST':
          return response.message || 'Invalid input provided';
        case 'ALREADY_EXISTS':
          return response.message || 'Role already exists';
        case 'CONFLICT':
          return response.message || 'Please try again';
        case 'FORBIDDEN':
          return 'Access Denied';
        case 'UNAUTHORIZED':
          logout();
          return 'Please log in to continue';
        case 'MONGO_EXCEPTION':
          console.error('MongoDB Error Details:', response.details);
          return 'An error occurred';
        case 'DB_CHECK_FAIL':
          return response.message || 'Database error occurred';
        case 'INTERNAL_SERVER_ERROR':
        default:
          return 'An unexpected error occurred';
      }
    }
    return null;
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/roles/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to fetch roles');
      }

      if (data.success && data.type === 1 && data.data) {
        setRoles((data.data as { data: Role[] }).data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error fetching roles:', error);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      showMessage('Role name cannot be empty!', false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/roles/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to create role');
      }

      if (data.success && data.type === 1 && data.data) {
        setRoles([...roles, data.data as Role]);
        setNewRoleName('');
        showMessage('Role created successfully!', true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error creating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/roles/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_id: roleId }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to delete role');
      }

      if (data.success && data.type === 1) {
        setRoles(roles.filter(role => role._id !== roleId));
        showMessage('Role deleted successfully!', true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error deleting role:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const openDeleteModal = (roleId: string) => {
    setRoleToDelete(roleId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setRoleToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      handleDeleteRole(roleToDelete);
    }
  };

  const showMessage = (msg: string, success: boolean) => {
    setMessage(msg);
    setIsSuccess(success);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Manage Roles</h2>
      <form onSubmit={handleCreateRole} className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:space-x-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full p-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter role name"
            />
          </div>
          <div className="mt-4 sm:mt-0 sm:self-end">
            <button
              type="submit"
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Existing Roles</h3>
        {roles.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No roles found</p>
        ) : (
          <ul className="space-y-2">
            {roles.map((role) => (
              <li
                key={role._id}
                className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 text-xs"
              >
                <span>{role.name}</span>
                <button
                  onClick={() => openDeleteModal(role._id)}
                  className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                  disabled={isLoading}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-80">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Confirm Deletion</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this role? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-3 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 text-xs bg-red-500 text-white hover:bg-red-600 rounded-lg disabled:bg-red-300"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`fixed bottom-5 right-5 p-3 rounded-lg shadow-lg text-sm flex items-center ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isSuccess ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ExclamationCircleIcon className="w-5 h-5 mr-2" />}
          <span>{message}</span>
          <button className="ml-3 text-sm hover:opacity-70" onClick={() => setMessage(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default RolesTemplate;
