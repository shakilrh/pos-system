import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, UserGroupIcon, UserIcon, KeyIcon } from '@heroicons/react/24/outline';
import { fetchRoles, deleteRole } from '../../services/RoleService';
import { fetchPermissions } from '../../services/PermissionService';
import FlashMessage from '../FlashMessage';
import RoleList from './roleList';
import RoleCrud from './RoleCrud';
import RolePermissions from './rolePermissions';
import { Role, RolesTemplateProps } from './roleTypes';
import { Permission } from './permissionsTypes';

const RolesTemplate: React.FC<RolesTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: false,
    roleUpdate: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeSection, setActiveSection] = useState<'list' | 'assign'>('list');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const loadData = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const [rolesData, permissionsData] = await Promise.all([
        fetchRoles(token!, logout),
        fetchPermissions(token!, logout),
      ]);
      setRoles(rolesData.map((role) => ({
        ...role,
        permissions: role.permissions || [],
      })));
      setPermissions(permissionsData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch data');
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

  const handleDeleteRole = async (roleId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await deleteRole(token!, logout, roleId);
      setRoles((prev) => prev.filter((role) => role._id !== roleId));
      setDeleteConfirm(null);
      setMessage('Role deleted successfully!');
      setIsSuccess(true);
      if (roles.length <= (currentPage - 1) * 6 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete role');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="space-y-3 p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
      {message && (
        <FlashMessage
          message={message}
          type={isSuccess ? 'success' : 'error'}
          onClose={() => setMessage(null)}
        />
      )}
      <div className="rounded-lg p-3 mb-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center mb-4">
          <button className="mr-2" style={{ color: 'var(--text-secondary)' }}>
            <UserIcon className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Role Management</h3>
        </div>
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
              setEditRole(null);
              setShowCreateForm(false);
              setSearchQuery('');
              setCurrentPage(1);
              setSelectedRole(null);
            }}
          >
            <UserGroupIcon className="w-4 h-4" />
            <span>Role List</span>
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
              setEditRole(null);
              setShowCreateForm(false);
              setSearchQuery('');
              setCurrentPage(1);
              setSelectedRole(null);
            }}
          >
            <KeyIcon className="w-4 h-4" />
            <span>Assign Role Permissions</span>
          </button>
        </div>
      </div>
      {activeSection === 'list' && !showCreateForm && !editRole && (
        <RoleList
          roles={roles}
          setEditRole={setEditRole}
          handleDeleteRole={handleDeleteRole}
          isLoading={isLoading}
          setDeleteConfirm={setDeleteConfirm}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          setShowCreateForm={setShowCreateForm}
        />
      )}
      {(showCreateForm || editRole) && (
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
          loadRoles={loadData}
          setSelectedRole={setSelectedRole}
          setActiveSection={setActiveSection}
        />
      )}
      {editRole && (
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
          fromEdit={true}
        />
      )}
      {activeSection === 'assign' && !editRole && (
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
          fromEdit={false}
        />
      )}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[--surface-color] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <ExclamationCircleIcon className="w-6 h-6" style={{ color: 'var(--error-color)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Confirm Delete</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this role? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteRole(deleteConfirm)}
                disabled={isLoading.delete}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--error-color)] text-white hover:bg-opacity-90'}`}
                style={{
                  '--tw-ring-color': 'var(--focus-ring)'
                } as React.CSSProperties}
              >
                {isLoading.delete ? (
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
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                style={{
                  backgroundColor: isLoading.delete ? undefined : 'var(--background-color)',
                  '--tw-ring-color': 'var(--focus-ring)'
                } as React.CSSProperties}
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
