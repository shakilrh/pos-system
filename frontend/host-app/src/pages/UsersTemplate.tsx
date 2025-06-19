import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { fetchUsers, createUser, updateUser, deleteUser, assignRole } from '../services/UserService';
import { fetchRoles } from '../services/RoleService';

interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  user_type: 'worker';
  role_id: string | null;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
}

interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface UsersTemplateProps {
  token: string | null;
  logout: () => void;
}

const UsersTemplate: React.FC<UsersTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', user_type: 'worker' as const, role_id: '', phone_number: '', job_title: '', shift_time: '', salary: '',
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [assignRoleData, setAssignRoleData] = useState({ user_id: '', role_id: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState({ fetch: false, create: false, update: false, delete: false, assign: false });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 6;

  useEffect(() => {
    if (token) {
      setIsLoading((prev) => ({ ...prev, fetch: true }));
      Promise.all([
        fetchRoles(token, logout).then(setRoles),
        fetchUsers(token, logout).then((data) => {
          setUsers(data);
          setFilteredUsers(data);
        }),
      ]).catch((error) => {
        showMessage(error instanceof Error ? error.message : 'Failed to fetch data', false);
      }).finally(() => setIsLoading((prev) => ({ ...prev, fetch: false })));
    }
  }, [token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const filtered = users.filter((user) =>
      [
        user.name || '', // Default to empty string if undefined
        user.email || '', // Default to empty string if undefined
        roles.find((role) => role._id === user.role_id)?.name || '' // Default to empty string if role not found
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users, roles]);

  const showMessage = (msg: string, success: boolean) => {
    setMessage(msg);
    setIsSuccess(success);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showMessage('Please fill in all required fields!', false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const userData: Partial<User> = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim(),
        user_type: newUser.user_type,
        phone_number: newUser.phone_number.trim() || undefined,
        job_title: newUser.job_title.trim() || undefined,
        shift_time: newUser.shift_time.trim() || undefined,
        salary: newUser.salary ? parseFloat(newUser.salary) : undefined,
        role_id: newUser.role_id || undefined,
      };
      const createdUser = await createUser(token!, logout, userData);
      setUsers([...users, createdUser]);
      setFilteredUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', password: '', user_type: 'worker', role_id: '', phone_number: '', job_title: '', shift_time: '', salary: '' });
      showMessage('User created successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to create user', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const userData: Partial<User> = { _id: editUser._id };
      if (editUser.name !== originalUser?.name) userData.name = editUser.name.trim();
      if (editUser.email !== originalUser?.email) userData.email = editUser.email.trim();
      if (editUser.password) userData.password = editUser.password.trim();
      if (editUser.user_type !== originalUser?.user_type) userData.user_type = editUser.user_type;
      if (editUser.role_id !== originalUser?.role_id) userData.role_id = editUser.role_id || undefined;
      if (editUser.phone_number !== originalUser?.phone_number) userData.phone_number = editUser.phone_number?.trim() || undefined;
      if (editUser.job_title !== originalUser?.job_title) userData.job_title = editUser.job_title?.trim() || undefined;
      if (editUser.shift_time !== originalUser?.shift_time) userData.shift_time = editUser.shift_time?.trim() || undefined;
      if (editUser.salary !== originalUser?.salary) userData.salary = editUser.salary ? parseFloat(editUser.salary.toString()) : undefined;
      const updatedUser = await updateUser(token!, logout, userData);
      setUsers(users.map((u) => (u._id === editUser._id ? updatedUser : u)));
      setFilteredUsers(users.map((u) => (u._id === editUser._id ? updatedUser : u)));
      setEditUser(null);
      setOriginalUser(null);
      showMessage('User updated successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to update user', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await deleteUser(token!, logout, userId);
      const updatedUsers = users.filter((u) => u._id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      showMessage('User deleted successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to delete user', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRoleData.user_id || !assignRoleData.role_id) {
      showMessage('Please select a user and role!', false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, assign: true }));
    try {
      const updatedUser = await assignRole(token!, logout, assignRoleData.user_id, assignRoleData.role_id);
      setUsers(users.map((user) => (user._id === assignRoleData.user_id ? updatedUser : user)));
      setFilteredUsers(users.map((user) => (user._id === assignRoleData.user_id ? updatedUser : user)));
      setAssignRoleData({ user_id: '', role_id: '' });
      showMessage('Role assigned successfully!', true);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to assign role', false);
    } finally {
      setIsLoading((prev) => ({ ...prev, assign: false }));
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">User Management</h2>

        {/* Create User Form */}
        <details className="mb-6">
          <summary className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer">Add New User</summary>
          <form onSubmit={handleCreateUser} className="space-y-6 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Name', type: 'text', value: newUser.name, onChange: (e: any) => setNewUser({ ...newUser, name: e.target.value }), required: true },
                { label: 'Email', type: 'email', value: newUser.email, onChange: (e: any) => setNewUser({ ...newUser, email: e.target.value }), required: true },
                { label: 'Password', type: 'password', value: newUser.password, onChange: (e: any) => setNewUser({ ...newUser, password: e.target.value }), required: true },
                { label: 'User Type', type: 'text', value: 'Worker', disabled: true },
                { label: 'Role (Optional)', type: 'select', value: newUser.role_id, onChange: (e: any) => setNewUser({ ...newUser, role_id: e.target.value }), options: roles },
                { label: 'Phone Number (Optional)', type: 'tel', value: newUser.phone_number, onChange: (e: any) => setNewUser({ ...newUser, phone_number: e.target.value }) },
                { label: 'Job Title (Optional)', type: 'text', value: newUser.job_title, onChange: (e: any) => setNewUser({ ...newUser, job_title: e.target.value }) },
                { label: 'Shift Time (Optional)', type: 'text', value: newUser.shift_time, onChange: (e: any) => setNewUser({ ...newUser, shift_time: e.target.value }) },
                { label: 'Salary (Optional)', type: 'number', value: newUser.salary, onChange: (e: any) => setNewUser({ ...newUser, salary: e.target.value }) },
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                    >
                      <option value="">Select Role</option>
                      {field.options?.map((role: Role) => (
                        <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                      disabled={field.disabled}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:bg-indigo-400"
                disabled={isLoading.create}
              >
                {isLoading.create ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </details>

        {/* Edit User Form */}
        {editUser && (
          <details className="mb-6" open>
            <summary className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer">Edit User</summary>
            <form onSubmit={handleEditUser} className="space-y-6 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'Name', type: 'text', value: editUser.name, onChange: (e: any) => setEditUser({ ...editUser, name: e.target.value }) },
                  { label: 'Email', type: 'email', value: editUser.email, onChange: (e: any) => setEditUser({ ...editUser, email: e.target.value }) },
                  { label: 'Password (Optional)', type: 'password', value: editUser.password || '', onChange: (e: any) => setEditUser({ ...editUser, password: e.target.value || undefined }) },
                  { label: 'User Type', type: 'text', value: 'Worker', disabled: true },
                  { label: 'Role (Optional)', type: 'select', value: editUser.role_id || '', onChange: (e: any) => setEditUser({ ...editUser, role_id: e.target.value || null }), options: roles },
                  { label: 'Phone Number (Optional)', type: 'tel', value: editUser.phone_number || '', onChange: (e: any) => setEditUser({ ...editUser, phone_number: e.target.value || undefined }) },
                  { label: 'Job Title (Optional)', type: 'text', value: editUser.job_title || '', onChange: (e: any) => setEditUser({ ...editUser, job_title: e.target.value || undefined }) },
                  { label: 'Shift Time (Optional)', type: 'text', value: editUser.shift_time || '', onChange: (e: any) => setEditUser({ ...editUser, shift_time: e.target.value || undefined }) },
                  { label: 'Salary (Optional)', type: 'number', value: editUser.salary || '', onChange: (e: any) => setEditUser({ ...editUser, salary: e.target.value ? parseFloat(e.target.value) : undefined }) },
                ].map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                      >
                        <option value="">Select Role</option>
                        {field.options?.map((role: Role) => (
                          <option key={role._id} value={role._id}>{role.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={field.onChange}
                        className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                        disabled={field.disabled}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => { setEditUser(null); setOriginalUser(null); }}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:bg-indigo-400"
                  disabled={isLoading.update}
                >
                  {isLoading.update ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </details>
        )}

        {/* Assign Role Form */}
        <details className="mb-6">
          <summary className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer">Assign Role to User</summary>
          <form onSubmit={handleAssignRole} className="space-y-6 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select User</label>
                <select
                  value={assignRoleData.user_id}
                  onChange={(e) => setAssignRoleData({ ...assignRoleData, user_id: e.target.value })}
                  className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
                <select
                  value={assignRoleData.role_id}
                  onChange={(e) => setAssignRoleData({ ...assignRoleData, role_id: e.target.value })}
                  className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:bg-indigo-400"
                disabled={isLoading.assign}
              >
                {isLoading.assign ? 'Assigning...' : 'Assign Role'}
              </button>
            </div>
          </form>
        </details>

        {/* Users List */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Existing Users</h3>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Users</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                placeholder="Search by name, email, or role..."
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm rounded-lg ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
        {isLoading.fetch ? (
          <div className="animate-pulse space-y-4">
            {Array(3).fill(0).map((_, idx) => (
              <div key={idx} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : currentUsers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No users found</p>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
              </thead>
              <tbody>
              {currentUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{user.name || 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{user.email || 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{user.user_type || 'N/A'}</td>
                  <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{roles.find((role) => role._id === user.role_id)?.name || 'N/A'}</td>
                  <td className="py-4 px-6 flex justify-end space-x-3">
                    <button
                      onClick={() => { setEditUser({ ...user, password: '' }); setOriginalUser(user); }}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Edit User"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={isLoading.delete}
                      title="Delete User"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

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

export default UsersTemplate;
