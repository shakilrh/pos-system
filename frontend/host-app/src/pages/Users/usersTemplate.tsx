import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, PlusIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchUsers, createUser, updateUser, deleteUser, assignRole } from '../../services/UserService';
import { fetchRoles } from '../../services/RoleService';
import FlashMessage from '../FlashMessage';
import UserList from './userList';
import UserCrud from './userCrud';
import UserRole from './userRole';
import { User, Role, UsersTemplateProps, FormData, FormErrors } from './userTypes';

const UsersTemplate: React.FC<UsersTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({
    fetch: false,
    create: false,
    update: false,
    delete: '',
    assign: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    const filtered = users.filter((user) =>
      searchQuery
        ? [
          user.name || '',
          user.email || '',
          roles.find((role) => role._id === user.role_id)?.name || '',
        ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()))
        : true
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users, roles]);

  const loadData = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const [rolesData, usersData] = await Promise.all([
        fetchRoles(token!, logout),
        fetchUsers(token!, logout),
      ]);
      setRoles(rolesData);
      setUsers(usersData);
      setFilteredUsers(usersData); // Initialize filteredUsers with all users
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch data');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: userId }));
    try {
      await deleteUser(token!, logout, userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setFilteredUsers((prev) => prev.filter((u) => u._id !== userId));
      setDeleteConfirm(null);
      setMessage('User deleted successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete user');
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
      <UserCrud
        token={token}
        logout={logout}
        users={users}
        roles={roles}
        setUsers={setUsers}
        setFilteredUsers={setFilteredUsers}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        editUser={editUser}
        setEditUser={setEditUser}
        originalUser={originalUser}
        setOriginalUser={setOriginalUser}
        setMessage={setMessage}
        setIsSuccess={setIsSuccess}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      <UserList
        users={filteredUsers}
        roles={roles}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setEditUser={setEditUser}
        setOriginalUser={setOriginalUser}
        handleDeleteUser={handleDeleteUser}
        isLoading={isLoading}
        setDeleteConfirm={setDeleteConfirm}
      />
      <UserRole
        token={token}
        logout={logout}
        users={users}
        roles={roles}
        setUsers={setUsers}
        setFilteredUsers={setFilteredUsers}
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
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
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

export default UsersTemplate;
