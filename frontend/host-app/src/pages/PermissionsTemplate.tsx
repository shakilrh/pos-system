import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

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

interface ApiResponse<T = Role[] | Permission[]> {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: T;
  error?: 'DATA_NOT_FOUND' | 'BAD_REQUEST' | 'ALREADY_EXISTS' | 'CONFLICT' | 'FORBIDDEN' | 'UNAUTHORIZED' | 'MONGO_EXCEPTION' | 'DB_CHECK_FAIL' | 'INTERNAL_SERVER_ERROR';
  details?: any;
}

interface PermissionsTemplateProps {
  token: string | null;
  logout: () => void;
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://192.168.18.107:3000';

const PermissionsTemplate: React.FC<PermissionsTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [isLoading, setIsLoading] = useState({ fetch: false, create: false, delete: false, update: false });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchRoles();
      fetchPermissions();
    }
  }, [token]);

  const handleApiError = (response: ApiResponse<any>): string => {
    if (!response.success) {
      switch (response.error) {
        case 'DATA_NOT_FOUND': return 'Not Found';
        case 'BAD_REQUEST': return response.message || 'Invalid input provided';
        case 'ALREADY_EXISTS': return response.message || 'Permission already exists';
        case 'CONFLICT': return response.message || 'Please try again';
        case 'FORBIDDEN': return 'Access Denied';
        case 'UNAUTHORIZED':
          logout();
          window.location.href = '/pos-system/login';
          return 'Please log in to continue';
        case 'MONGO_EXCEPTION': return 'Database error occurred';
        case 'DB_CHECK_FAIL': return response.message || 'Database error occurred';
        default: return 'An unexpected error occurred';
      }
    }
    return '';
  };

  const fetchRoles = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse<Role[]> = await response.json();

      if (response.status === 401) {
        logout();
        window.location.href = '/pos-system/login';
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data));
      }

      setRoles(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch roles');
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const fetchPermissions = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/permissions/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse<Permission[]> = await response.json();

      if (response.status === 401) {
        logout();
        window.location.href = '/pos-system/login';
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data));
      }

      setPermissionsList(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch permissions');
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleCreatePermission = async () => {
    if (!permissionName.trim()) {
      toast.error('Permission key cannot be empty!');
      return;
    }
    if (permissionsList.some((p) => p.key === permissionName.trim())) {
      toast.error('Permission key already exists!');
      return;
    }
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/permissions/create`, {
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
      const data: ApiResponse<Permission> = await response.json();

      if (response.status === 401) {
        logout();
        window.location.href = '/pos-system/login';
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data));
      }

      setPermissionsList([...permissionsList, data.data as Permission]);
      setPermissionName('');
      setPermissionDescription('');
      toast.success('Permission created successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create permission');
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/permissions/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permission_id: permissionId }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        logout();
        window.location.href = '/pos-system/login';
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data));
      }

      setPermissionsList(permissionsList.filter((p) => p._id !== permissionId));
      toast.success('Permission removed successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete permission');
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
      setShowDeleteModal(false);
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions((prev) => (checked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId)));
  };

  const handleUpdatePermissions = async (roleId: string) => {
    if (!roleId) {
      toast.error('Please select a role first!');
      return;
    }
    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const role = roles.find((r) => r._id === roleId);
      if (!role) throw new Error('Role not found');
      const currentPermissions = role.permissions.map((p) => p._id);
      const add_permission_ids: string[] = rolePermissions.filter((id) => !currentPermissions.includes(id));
      const remove_permission_ids: string[] = currentPermissions.filter((id) => !rolePermissions.includes(id));

      const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/roles/update-permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role_id: roleId, add_permission_ids, remove_permission_ids }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        logout();
        window.location.href = '/pos-system/login';
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(handleApiError(data));
      }

      toast.success('Permissions updated successfully!');
      setSelectedRoleForPermission(null);
      setRolePermissions([]);
      await fetchRoles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const loadRolePermissions = (roleId: string) => {
    const role = roles.find((r) => r._id === roleId);
    setRolePermissions(role?.permissions.map((p) => p._id) || []);
    setSelectedRoleForPermission(roleId);
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
    if (permissionToDelete) handleDeletePermission(permissionToDelete);
  };

  if (isLoading.fetch) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage Permissions</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Create Permission</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Use format: resource_action (e.g., orders_can_view, orders_can_edit, orders_can_delete)
          </p>
          <div className="flex flex-col sm:flex-row sm:space-x-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Permission Key</label>
              <input
                type="text"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., orders_can_view"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <input
                type="text"
                value={permissionDescription}
                onChange={(e) => setPermissionDescription(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter permission description"
              />
            </div>
            <div className="mt-4 sm:mt-6 sm:self-end">
              <button
                onClick={handleCreatePermission}
                className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                disabled={isLoading.create}
              >
                {isLoading.create ? 'Creating...' : 'Create Permission'}
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
                  className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 text-xs"
                >
                  <div>
                    <span className="font-semibold">{permission.key}</span>
                    {permission.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">{permission.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openDeleteModal(permission._id)}
                    className="text-red-600 hover:text-red-800 p-1 mt-2 sm:mt-0 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                    disabled={isLoading.delete}
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
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
              <select
                value={selectedRoleForPermission || ''}
                onChange={(e) => loadRolePermissions(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>
            {selectedRoleForPermission && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Permissions for Role</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {permissionsList.map((permission) => (
                    <div key={permission._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission._id)}
                        onChange={(e) => handlePermissionToggle(permission._id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                        disabled={isLoading.update}
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
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                  disabled={isLoading.update}
                >
                  {isLoading.update ? 'Updating...' : 'Update Permissions'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Confirm Deletion</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete this permission? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
                disabled={isLoading.delete}
              >
                {isLoading.delete ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsTemplate;
