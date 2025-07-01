import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { fetchRoles, deleteRole } from '../../services/RoleService';
import FlashMessage from '../FlashMessage';
import RoleList from './roleList';
import RoleCrud from './roleCrud';
import { Role, RolesTemplateProps } from './roleTypes';

const RolesTemplate: React.FC<RolesTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadRoles();
    }
  }, [token]);

  const loadRoles = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const rolesData = await fetchRoles(token!, logout);
      setRoles(rolesData.map((role) => ({
        ...role,
        permissions: role.permissions || [],
      })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch roles');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: roleId }));
    try {
      await deleteRole(token!, logout, roleId);
      setRoles((prev) => prev.filter((role) => role._id !== roleId));
      setDeleteConfirm(null);
      setMessage('Role deleted successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete role');
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
      <RoleCrud
        token={token}
        logout={logout}
        roles={roles}
        setRoles={setRoles}
        editRole={editRole}
        setEditRole={setEditRole}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        setMessage={setMessage}
        setIsSuccess={setIsSuccess}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      <RoleList
        roles={roles}
        setEditRole={setEditRole}
        handleDeleteRole={handleDeleteRole}
        isLoading={isLoading}
        setDeleteConfirm={setDeleteConfirm}
      />
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-md p-4 w-full max-w-sm mx-4">
            <div className="flex items-center space-x-2 mb-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this role? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDeleteRole(deleteConfirm)}
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

export default RolesTemplate;
