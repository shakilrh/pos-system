import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { fetchRoles, deleteRole } from '../../services/RoleService';
import FlashMessage from '../FlashMessage';
import RoleList from './roleList';
import RoleCrud from './roleCrud';
import { Role, RolesTemplateProps } from './roleTypes';

const RolesTemplate: React.FC<RolesTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  useEffect(() => {
    if (token) {
      loadRoles();
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
    <div className="space-y-6 p-6" style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}>
      {message && (
        <FlashMessage
          message={message}
          type={isSuccess ? 'success' : 'error'}
          onClose={() => setMessage(null)}
        />
      )}
      <div className="flex justify-between items-center border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button
          style={{
            background: 'var(--primary-color)',
            color: 'var(--surface-color)',
            borderBottom: '2px solid var(--primary-color)',
          }}
          className="flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none"
          onClick={() => {
            setEditRole(null);
            setShowCreateForm(false);
          }}
        >
          <UserGroupIcon className="w-5 h-5" />
          <span>Role List</span>
        </button>
        <button
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--surface-color)',
          }}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 hover:opacity-90 focus:outline-none"
          onClick={() => setShowCreateForm(true)}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Role</span>
        </button>
      </div>
      {showCreateForm && (
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
          loadRoles={loadRoles}
        />
      )}
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
      />
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
            style={{
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-color)',
            }}
          >
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
                style={{
                  backgroundColor: 'var(--error-color)',
                  color: 'var(--surface-color)',
                }}
                className="flex-1 hover:opacity-90 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                {isLoading.delete ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--surface-color)',
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {editRole && !showCreateForm && (
        <RoleCrud
          token={token}
          logout={logout}
          roles={roles}
          setRoles={setRoles}
          editRole={editRole}
          setEditRole={setEditRole}
          showCreateForm={false}
          setShowCreateForm={() => {}}
          setMessage={setMessage}
          setIsSuccess={setIsSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          loadRoles={loadRoles}
        />
      )}
    </div>
  );
};

export default RolesTemplate;
