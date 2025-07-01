import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { fetchRoles } from '../../services/RoleService';
import { fetchPermissions, deletePermission } from '../../services/PermissionService';
import FlashMessage from '../FlashMessage';
import PermissionList from './permissionList';
import PermissionCrud from './permissionCrud';
import RolePermissions from './rolePermissions';
import { Role, Permission, PermissionsTemplateProps } from './permissionsTypes';

const PermissionsTemplate: React.FC<PermissionsTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editPermission, setEditPermission] = useState<Permission | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: '',
    roleUpdate: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const [rolesData, permissionsData] = await Promise.all([
        fetchRoles(token!, logout),
        fetchPermissions(token!, logout),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load data');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: permissionId }));
    try {
      await deletePermission(token!, logout, permissionId);
      setPermissions((prev) => prev.filter((permission) => permission._id !== permissionId));
      setDeleteConfirm(null);
      setMessage('Permissions deleted successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete permission');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: '' }));
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <FlashMessage
          message={message}
          type={isSuccess ? 'success' : 'error'}
          onClose={() => setMessage(null)}
        />
      )}
      <PermissionCrud
        token={token}
        logout={logout}
        permissions={permissions}
        setPermissions={setPermissions}
        editPermission={editPermission}
        setEditPermission={setEditPermission}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        setMessage={setMessage}
        setIsSuccess={setIsSuccess}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      <PermissionList
        permissions={permissions}
        setEditPermission={setEditPermission}
        handleDeletePermission={handleDeletePermission}
        isLoading={isLoading}
        setDeleteConfirm={setDeleteConfirm}
      />
      <RolePermissions
        token={token}
        logout={logout}
        roles={roles}
        permissions={permissions}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        rolePermissions={rolePermissions}
        setRolePermissions={setRolePermissions}
        setMessage={setMessage}
        setIsSuccess={setIsSuccess}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 w-full max-w-sm mx-4">
            <div className="flex items-center space-x-2 mb-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this permission? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDeletePermission(deleteConfirm)}
                disabled={isLoading.delete === deleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1.5 rounded-md text-sm font-medium"
              >
                {isLoading.delete === deleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsTemplate;
