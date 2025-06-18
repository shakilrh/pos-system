import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { fetchRoles } from '../services/RoleService';
import { fetchPermissions, createPermission, deletePermission, updateRolePermissions } from '../services/PermissionService';

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

interface PermissionsTemplateProps {
  token: string | null;
  logout: () => void;
}

const PermissionsTemplate: React.FC<PermissionsTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [selectedRoleForPermission, setSelectedRoleForPermission] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [permissionName, setPermissionName] = useState('');
  const [permissionDescription, setPermissionDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({ fetch: false, create: false, delete: false, update: false });

  useEffect(() => {
    if (token) {
      setIsLoading((prev) => ({ ...prev, fetch: true }));
      Promise.all([
        fetchRoles(token, logout).then(setRoles),
        fetchPermissions(token, logout).then(setPermissionsList),
      ]).finally(() => setIsLoading((prev) => ({ ...prev, fetch: false })));
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

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionName.trim()) {
      showMessage('Permission key cannot be empty!', false);
      return;
    }
    if (permissionsList.some((p) => p.key === permissionName.trim())) {
      showMessage('Permission key already exists!', false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const newPermission = await createPermission(token!, logout, permissionName, permissionDescription);
      setPermissionsList([...permissionsList, newPermission]);
      setPermissionName('');
      setPermissionDescription('');
      showMessage('Permission created successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to create permission', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await deletePermission(token!, logout, permissionId);
      setPermissionsList(permissionsList.filter((p) => p._id !== permissionId));
      showMessage('Permission removed successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to delete permission', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions((prev) => (checked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId)));
  };

  const handleUpdatePermissions = async () => {
    if (!selectedRoleForPermission) {
      showMessage('Please select a role first!', false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const role = roles.find((r) => r._id === selectedRoleForPermission);
      if (!role) throw new Error('Role not found');
      const currentPermissions = role.permissions.map((p) => p._id);
      const add_permission_ids = rolePermissions.filter((id) => !currentPermissions.includes(id));
      const remove_permission_ids = currentPermissions.filter((id) => !rolePermissions.includes(id));
      await updateRolePermissions(token!, logout, selectedRoleForPermission, add_permission_ids, remove_permission_ids);
      setSelectedRoleForPermission(null);
      setRolePermissions([]);
      setRoles(await fetchRoles(token!, logout));
      showMessage('Permissions updated successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to update permissions', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const loadRolePermissions = (roleId: string) => {
    const role = roles.find((r) => r._id === roleId);
    setRolePermissions(role?.permissions.map((p) => p._id) || []);
    setSelectedRoleForPermission(roleId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Manage Permissions</h2>
      <div className="space-y-6">
        {/* Create Permission Form */}
        <details className="mb-6">
          <summary className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer">Create Permission</summary>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Use format: resource_action (e.g., orders_can_view, orders_can_edit)
            </p>
            <form onSubmit={handleCreatePermission} className="flex flex-col sm:flex-row sm:space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Permission Key</label>
                <input
                  type="text"
                  value={permissionName}
                  onChange={(e) => setPermissionName(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                  placeholder="e.g., orders_can_view"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={permissionDescription}
                  onChange={(e) => setPermissionDescription(e.target.value)}
                  className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                  placeholder="Enter permission description"
                />
              </div>
              <div className="mt-4 sm:mt-0 sm:self-end">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-indigo-300"
                  disabled={isLoading.create}
                >
                  {isLoading.create ? 'Creating...' : 'Create Permission'}
                </button>
              </div>
            </form>
          </div>
        </details>

        {/* Permissions List */}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Existing Permissions</h3>
        {isLoading.fetch ? (
          <div className="animate-pulse space-y-2">
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : permissionsList.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No permissions found</p>
        ) : (
          <ul className="space-y-2">
            {permissionsList.map((permission) => (
              <li
                key={permission._id}
                className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
              >
                <div>
                  <span className="font-semibold">{permission.key}</span>
                  {permission.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs">{permission.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePermission(permission._id)}
                  className="text-red-600 hover:text-red-800 mt-2 sm:mt-0"
                  disabled={isLoading.delete}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Assign Permissions to Roles */}
        <details className="mb-6">
          <summary className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer">Assign Permissions to Roles</summary>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
              <select
                value={selectedRoleForPermission || ''}
                onChange={(e) => loadRolePermissions(e.target.value)}
                className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
              >
                <option value="">Select a role</option>
                {Array.isArray(roles) && roles.map((role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>
            {selectedRoleForPermission && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Permissions for Role</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {permissionsList.map((permission) => (
                    <div key={permission._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission._id)}
                        onChange={(e) => handlePermissionToggle(permission._id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded"
                        disabled={isLoading.update}
                      />
                      <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {permission.key}
                        {permission.description && (
                          <span className="text-gray-500 dark:text-gray-400"> ({permission.description})</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleUpdatePermissions}
                  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:bg-indigo-300"
                  disabled={isLoading.update}
                >
                  {isLoading.update ? 'Updating...' : 'Update Permissions'}
                </button>
              </div>
            )}
          </div>
        </details>
      </div>

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

export default PermissionsTemplate;
