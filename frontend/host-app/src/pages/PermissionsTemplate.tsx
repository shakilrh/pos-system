import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

// Interfaces for type safety
interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface Permission {
  _id: string;
  key: string;
  description?: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: { data: Role[] | Permission[] } | Permission;
  error?: string;
  details?: any;
}

interface PermissionsTemplateProps {
  token: string | null;
  logout: () => void;
}

const PermissionsTemplate: React.FC<PermissionsTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [permissionName, setPermissionName] = useState<string>('');
  const [permissionDescription, setPermissionDescription] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchRoles();
      fetchPermissions();
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
          return response.message || 'Permission already exists';
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

  const fetchPermissions = async () => {
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/permissions/list', {
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
        throw new Error(errorMessage || 'Failed to fetch permissions');
      }

      if (data.success && data.type === 1 && data.data) {
        setPermissionsList((data.data as { data: Permission[] }).data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error fetching permissions:', error);
    }
  };

  const handleCreatePermission = async () => {
    if (!permissionName.trim()) {
      showMessage('Permission key cannot be empty!', false);
      return;
    }
    if (permissionsList.some(p => p.key === permissionName.trim())) {
      showMessage('Permission key already exists!', false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/permissions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: permissionName.trim(),
          description: permissionDescription.trim() || undefined,
        }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to create permission');
      }

      if (data.success && data.type === 1 && data.data) {
        setPermissionsList([...permissionsList, data.data as Permission]);
        setPermissionName('');
        setPermissionDescription('');
        showMessage('Permission created successfully!', true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error creating permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/permissions/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permission_id: permissionId }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to delete permission');
      }

      if (data.success && data.type === 1) {
        setPermissionsList(permissionsList.filter(p => p._id !== permissionId));
        showMessage('Permission removed successfully!', true);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error deleting permission:', error, {
        endpoint: 'http://192.168.18.107:3000/rolepermission/api/v1/permissions/delete',
        permissionId,
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ permission_id: permissionId }),
      });
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions(prev =>
      checked ? [...prev, permissionId] : prev.filter(id => id !== permissionId)
    );
  };

  const handleUpdatePermissions = async (roleId: string) => {
    if (!roleId) {
      showMessage('Please select a role first!', false);
      return;
    }
    setIsLoading(true);
    try {
      const role = roles.find(r => r._id === roleId);
      const currentPermissions = role?.permissions?.map(p => p._id) || [];
      const add_permission_ids = rolePermissions.filter(id => !currentPermissions.includes(id));
      const remove_permission_ids = currentPermissions.filter(id => !rolePermissions.includes(id));

      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/roles/update-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_id: roleId, add_permission_ids, remove_permission_ids }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to update permissions');
      }

      if (data.success && data.type === 1) {
        showMessage('Permissions updated successfully!', true);
        setSelectedRoleForPermission(null);
        setRolePermissions([]);
        await fetchRoles();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error updating permissions:', error, {
        endpoint: 'http://192.168.18.107:3000/rolepermission/api/v1/roles/update-permissions',
        roleId,
        add_permission_ids,
        remove_permission_ids,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRolePermissions = (roleId: string) => {
    const role = roles.find(r => r._id === roleId);
    setRolePermissions(role?.permissions?.map(p => p._id) || []);
    setSelectedRoleForPermission(roleId);
  };

  const showMessage = (msg: string, success: boolean) => {
    setMessage(msg);
    setIsSuccess(success);
  };

  const openDeleteModal = (permissionId: string) => {
    setPermissionToDelete(permissionId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setPermissionToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    if (permissionToDelete) {
      handleDeletePermission(permissionToDelete);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Manage Permissions</h2>
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Create Permission</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Use format: resource_action (e.g., orders_can_view, orders_can_edit, orders_can_delete)
          </p>
          <div className="flex flex-col sm:flex-row sm:space-x-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Permission Key</label>
              <input
                type="text"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., orders_can_view"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                type="text"
                value={permissionDescription}
                onChange={(e) => setPermissionDescription(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter permission description"
              />
            </div>
            <div className="mt-4 sm:mt-0 sm:self-end">
              <button
                onClick={handleCreatePermission}
                className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Permission'}
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Existing Permissions</h3>
          {permissionsList.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">No permissions found</p>
          ) : (
            <ul className="space-y-2">
              {permissionsList.map((permission) => (
                <li
                  key={permission._id}
                  className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 text-xs"
                >
                  <div>
                    <span className="font-semibold">{permission.key}</span>
                    {permission.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">{permission.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openDeleteModal(permission._id)}
                    className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50 mt-2 sm:mt-0"
                    disabled={isLoading}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Assign Permissions to Roles</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
              <select
                value={selectedRoleForPermission || ''}
                onChange={(e) => loadRolePermissions(e.target.value)}
                className="w-full p-2 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedRoleForPermission && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Permissions for Role</h4>
                <div className="space-y-2">
                  {permissionsList.map((permission) => (
                    <div key={permission._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission._id)}
                        onChange={(e) => handlePermissionToggle(permission._id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                        {permission.key}
                        {permission.description && (
                          <span className="text-gray-500 dark:text-gray-400"> ({permission.description})</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleUpdatePermissions(selectedRoleForPermission)}
                  className="mt-3 bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Permissions'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-80">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Confirm Deletion</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this permission? This action cannot be undone.
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

export default PermissionsTemplate;
