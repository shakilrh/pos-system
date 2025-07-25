import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../services/UserService';
import { fetchRoles } from '../../services/RoleService';
import FlashMessage from '../FlashMessage';
import UserList from './userList';
import UserCrud from './userCrud';
import UserRole from './userRole';
import { User, Role, UsersTemplateProps } from './userTypes';
import { useAuth } from '../../context/AuthContext';
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
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'role'>('list');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { userPermissions, permissionsLoaded } = useAuth();
  useEffect(() => {
    if (token) loadData();
  }, [token]);

  useEffect(() => {
    const filtered = users.filter((user) =>
      searchQuery
        ? [user.name || '', user.email || '', roles.find((r) => r._id === user.role_id)?.name || ''].some((field) =>
          field.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : true
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
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

  const handleCreateUser = async (userData: Partial<User>) => {
    setIsLoading((prev) => ({ ...prev, create: true }));
    setMessage(null);
    try {
      const createdUser = await createUser(token!, logout, userData);
      setUsers((prev) => [...prev, createdUser]);
      setFilteredUsers((prev) => [...prev, createdUser]);
      setMessage('User created successfully!');
      setIsSuccess(true);
      setShowCreateForm(false);
      await loadData();
      setCurrentPage(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setMessage(errorMessage);
      setIsSuccess(false);
      throw error;
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdateUser = async (userData: Partial<User>) => {
    setIsLoading((prev) => ({ ...prev, update: true }));
    setMessage(null);
    try {
      if (!editUser || !editUser._id) throw new Error('User ID is required for update');
      const updatedUserData = { ...userData, _id: editUser._id };
      if (updatedUserData.role_id === '') updatedUserData.role_id = null;
      const updatedUser = await updateUser(token!, logout, updatedUserData);
      setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      setFilteredUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      setEditUser(null);
      setOriginalUser(null);
      setMessage('User updated successfully!');
      setIsSuccess(true);
      await loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      setMessage(errorMessage);
      setIsSuccess(false);
      console.error('Update user error:', error);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    setMessage(null);
    try {
      await deleteUser(token!, logout, userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setFilteredUsers((prev) => prev.filter((u) => u._id !== userId));
      setMessage('User deleted successfully!');
      setIsSuccess(true);
      if (filteredUsers.length <= (currentPage - 1) * 6 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setMessage(errorMessage);
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
      resetForm();
    }
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditUser(null);
    setOriginalUser(null);
    setDeleteUserId(null);
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
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>User Management</h3></div></div>
      <div className="flex justify-between items-center border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col sm:flex-row sm:gap-2">
          <button
            style={{
              background: activeSection === 'list' ? 'var(--primary-color)' : 'var(--surface-color)',
              color: activeSection === 'list' ? 'var(--surface-color)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'list' ? '2px solid var(--primary-color)' : '2px solid transparent',
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none"
            onClick={() => {
              setActiveSection('list');
              resetForm();
            }}
          >
            <UserIcon className="w-4 h-4" />
            <span>User List</span>
          </button>
          {userPermissions.includes('assign_roles') && (
          <button
            style={{
              background: activeSection === 'role' ? 'var(--primary-color)' : 'var(--surface-color)',
              color: activeSection === 'role' ? 'var(--surface-color)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'role' ? '2px solid var(--primary-color)' : '2px solid transparent',
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none"
            onClick={() => {
              setActiveSection('role');
              resetForm();
            }}
          >
            <UserIcon className="w-4 h-4" />
            <span>Assign Role</span>
          </button>)}
        </div>
      </div>
      {activeSection === 'list' && (
        <>
          {(!showCreateForm && !editUser) && (
            <UserList
              token={token}
              logout={logout}
              users={filteredUsers}
              roles={roles}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setUsers={setUsers}
              setFilteredUsers={setFilteredUsers}
              setMessage={setMessage}
              setIsSuccess={setIsSuccess}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              showCreateForm={showCreateForm}
              setShowCreateForm={setShowCreateForm}
              setEditUser={setEditUser}
              setOriginalUser={setOriginalUser}
              setDeleteUserId={setDeleteUserId}
            />
          )}
          {(showCreateForm || editUser) && (
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
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              mode={editUser ? 'edit' : 'create'}
              deleteUserId={null}
              onCancel={resetForm}
            />
          )}
          {deleteUserId && (
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
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              mode="delete"
              deleteUserId={deleteUserId}
              onCancel={resetForm}
            />
          )}
        </>
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
    </div>
  );
};

export default UsersTemplate;
