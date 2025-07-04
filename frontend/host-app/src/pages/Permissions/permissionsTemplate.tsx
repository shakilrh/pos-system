import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, KeyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
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
  const [activeSection, setActiveSection] = useState<'list' | 'add' | 'assign'>('list');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadPermissions = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const permissionsData = await fetchPermissions(token!, logout);
      setPermissions(permissionsData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load permissions');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

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

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const handleDeletePermission = async (permissionId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: permissionId }));
    try {
      await deletePermission(token!, logout, permissionId);
      setPermissions((prev) => prev.filter((permission) => permission._id !== permissionId));
      setDeleteConfirm(null);
      setMessage('Permission deleted successfully!');
      setIsSuccess(true);
      if (permissions.length <= (currentPage - 1) * 6 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete permission');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: '' }));
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {message && (
        <FlashMessage
          message={message}
          type={isSuccess ? 'success' : 'error'}
          onClose={() => setMessage(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
            activeSection === 'list'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => {
            setActiveSection('list');
            setEditPermission(null);
            setShowCreateForm(false);
            setSearchQuery('');
            setCurrentPage(1);
          }}
        >
          <KeyIcon className="w-5 h-5" />
          <span>Permission List</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
            activeSection === 'add'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => {
            setActiveSection('add');
            setEditPermission(null);
            setShowCreateForm(true);
            setSearchQuery('');
            setCurrentPage(1);
          }}
        >
          <KeyIcon className="w-5 h-5" />
          <span>Add Permission</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
            activeSection === 'assign'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => {
            setActiveSection('assign');
            setEditPermission(null);
            setShowCreateForm(false);
            setSearchQuery('');
            setCurrentPage(1);
          }}
        >
          <UserGroupIcon className="w-5 h-5" />
          <span>Assign Role Permissions</span>
        </button>
      </div>
      {activeSection === 'add' && (
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
          loadPermissions={loadPermissions}
          setActiveSection={setActiveSection}
        />
      )}
      {activeSection === 'list' && (
        <div className="space-y-6">
          <PermissionList
            permissions={permissions}
            setEditPermission={setEditPermission}
            handleDeletePermission={handleDeletePermission}
            isLoading={isLoading}
            setDeleteConfirm={setDeleteConfirm}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          {editPermission && (
            <PermissionCrud
              token={token}
              logout={logout}
              permissions={permissions}
              setPermissions={setPermissions}
              editPermission={editPermission}
              setEditPermission={setEditPermission}
              showCreateForm={false}
              setShowCreateForm={setShowCreateForm}
              setMessage={setMessage}
              setIsSuccess={setIsSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              loadPermissions={loadPermissions}
              setActiveSection={setActiveSection}
            />
          )}
        </div>
      )}
      {activeSection === 'assign' && (
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setActiveSection={setActiveSection}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Delete</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this permission? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeletePermission(deleteConfirm)}
                disabled={isLoading.delete === deleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                {isLoading.delete === deleteConfirm ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
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
