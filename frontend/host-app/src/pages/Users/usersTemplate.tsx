import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/UserService';
import { fetchRoles } from '../../services/RoleService';
import FlashMessage from '../FlashMessage';
import UserList from './userList';
import UserCrud from './userCrud';
import UserRole from './userRole';
import { User, Role, UsersTemplateProps } from './userTypes';

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
    delete: false,
    assign: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'add' | 'list' | 'role'>('list');
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
          roles.find(r => r._id === user.role_id)?.name || '',
        ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()))
        : true
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to page 1 on search change
  }, [searchQuery, users, roles]);

  const loadData = async () => {
    setIsLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const rolesData = await fetchRoles(token!, logout);
      const usersData = await fetchUsers(token!, logout);
      setRoles(rolesData);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to fetch data');
      setIsSuccess(false);
      console.error('Fetch error:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await deleteUser(token!, logout, userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setFilteredUsers((prev) => prev.filter((u) => u._id !== userId));
      setDeleteConfirm(null);
      setMessage('User deleted successfully!');
      setIsSuccess(true);
      if (filteredUsers.length <= (currentPage - 1) * 6 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete user');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const createdUser = await createUser(token!, logout, userData);
      setUsers((prev) => [...prev, createdUser]);
      setFilteredUsers((prev) => [...prev, createdUser]);
      setMessage('User created successfully!');
      setIsSuccess(true);
      await loadData();
      setCurrentPage(1); // Reset to page 1 after creating user
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create user');
      setIsSuccess(false);
      console.error('Create user error:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      if (!editUser || !editUser._id) {
        throw new Error('User ID is required for update');
      }
      const updatedUserData = { ...userData, _id: editUser._id };
      if (userData.role_id === '') {
        updatedUserData.role_id = null;
      }
      const updatedUser = await updateUser(token!, logout, updatedUserData);
      setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      setFilteredUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      setEditUser(null);
      setOriginalUser(null);
      setMessage('User updated successfully!');
      setIsSuccess(true);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update user');
      setIsSuccess(false);
      console.error('Update user error:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
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
            setEditUser(null);
            setOriginalUser(null);
          }}
        >
          <UserIcon className="w-5 h-5" />
          <span>User List</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
            activeSection === 'add'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => {
            setActiveSection('add');
            setEditUser(null);
            setOriginalUser(null);
          }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add User</span>
        </button>
        <button
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
            activeSection === 'role'
              ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => {
            setActiveSection('role');
            setEditUser(null);
            setOriginalUser(null);
          }}
        >
          <UserIcon className="w-5 h-5" />
          <span>Assign Role</span>
        </button>
      </div>
      {activeSection === 'add' && (
        <UserCrud
          token={token}
          logout={logout}
          users={users}
          roles={roles}
          setUsers={setUsers}
          setFilteredUsers={setFilteredUsers}
          showCreateForm={activeSection === 'add'}
          setShowCreateForm={(show: boolean) => setActiveSection(show ? 'add' : 'list')}
          editUser={editUser}
          setEditUser={setEditUser}
          originalUser={originalUser}
          setOriginalUser={setOriginalUser}
          setMessage={setMessage}
          setIsSuccess={setIsSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
        />
      )}
      {activeSection === 'list' && (
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
      )}
      {activeSection === 'role' && (
        <UserRole
          token={token}
          logout={logout}
          users={users}
          roles={roles}
          setUsers={setUsers}
          setFilteredUsers={setFilteredUsers}
          setMessage={setMessage}
          setIsSuccess={setIsSuccess}
          isLoading={{ assign: isLoading.assign }}
          setIsLoading={(state) => setIsLoading((prev) => ({ ...prev, assign: state.assign }))}
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
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={isLoading.delete}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                {isLoading.delete ? 'Deleting...' : 'Delete'}
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
      {editUser && activeSection === 'list' && (
        <UserCrud
          token={token}
          logout={logout}
          users={users}
          roles={roles}
          setUsers={setUsers}
          setFilteredUsers={setFilteredUsers}
          showCreateForm={false}
          setShowCreateForm={() => {}}
          editUser={editUser}
          setEditUser={setEditUser}
          originalUser={originalUser}
          setOriginalUser={setOriginalUser}
          setMessage={setMessage}
          setIsSuccess={setIsSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default UsersTemplate;
