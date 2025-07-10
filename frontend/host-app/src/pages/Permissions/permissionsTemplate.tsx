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
  const [activeSection, setActiveSection] = useState<'list' | 'assign'>('list');
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
    <div className="space-y-3 p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
      <div className="min-h-[50px]">
        {message && (
          <FlashMessage
            message={message}
            type={isSuccess ? 'success' : 'error'}
            onClose={() => setMessage(null)}
          />
        )}
      </div>
      <div className="flex justify-between items-center border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col sm:flex-row sm:gap-2">
          <button
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none`}
            style={{
              background: activeSection === 'list' ? 'var(--primary-color)' : 'var(--surface-color)',
              color: activeSection === 'list' ? 'var(--surface-color)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'list' ? '2px solid var(--primary-color)' : '2px solid transparent',
            }}
            onClick={() => {
              setActiveSection('list');
              setEditPermission(null);
              setShowCreateForm(false);
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            <KeyIcon className="w-4 h-4" />
            <span>Permission List</span>
          </button>
          <button
            className={`flex items-center space-x-1 px-2.5 py-1.5 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none`}
            style={{
              background: activeSection === 'assign' ? 'var(--primary-color)' : 'var(--surface-color)',
              color: activeSection === 'assign' ? 'var(--surface-color)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'assign' ? '2px solid var(--primary-color)' : '2px solid transparent',
            }}
            onClick={() => {
              setActiveSection('assign');
              setEditPermission(null);
              setShowCreateForm(false);
              setSearchQuery('');
              setCurrentPage(1);
            }}
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>Assign Role Permissions</span>
          </button>
        </div>
      </div>
      {(showCreateForm || editPermission) && (
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
      {activeSection === 'list' && !showCreateForm && !editPermission && (
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
          setShowCreateForm={setShowCreateForm}
        />
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[--surface-color] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <ExclamationCircleIcon className="w-6 h-6 text-[--error-color]" />
              <h3 className="text-lg font-semibold text-[--text-color]">Confirm Delete</h3>
            </div>
            <p className="text-sm text-[--text-secondary] mb-6">
              Are you sure you want to delete this permission? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeletePermission(deleteConfirm)}
                disabled={isLoading.delete === deleteConfirm}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete === deleteConfirm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[--error-color] text-white hover:bg-opacity-90'}`}
                style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
              >
                {isLoading.delete === deleteConfirm ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete === deleteConfirm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                style={{ backgroundColor: isLoading.delete === deleteConfirm ? undefined : 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
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
