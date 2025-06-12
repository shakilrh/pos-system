import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Interfaces for type safety
interface User {
  _id: string;
  user_id?: string;
  name: string;
  email: string;
  password?: string;
  user_type: 'worker';
  role_id: string | null;
  phone_number?: string;
  job_title?: string;
  shift_time?: string;
  salary?: number;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; key: string }[];
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  type: number;
  data?: { data?: { user?: User } | { users?: User[] } | Role[] | User[] } | User | { role_id: string };
  error?: string;
  details?: any;
}

interface UsersTemplateProps {
  token: string | null;
  logout: () => void;
}

const UsersTemplate: React.FC<UsersTemplateProps> = ({ token, logout }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    password: string;
    user_type: 'worker';
    role_id: string;
    phone_number: string;
    job_title: string;
    shift_time: string;
    salary: string;
  }>({
    name: '',
    email: '',
    password: '',
    user_type: 'worker',
    role_id: '',
    phone_number: '',
    job_title: '',
    shift_time: '',
    salary: '',
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [assignRole, setAssignRole] = useState<{
    user_id: string;
    role_id: string;
  }>({
    user_id: '',
    role_id: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const usersPerPage = 6;

  useEffect(() => {
    if (token) {
      fetchRoles();
      fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const roleName = roles.find((role) => role._id === user.role_id)?.name || '';
      return (
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        roleName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchQuery, users, roles]);

  const handleApiError = (response: ApiResponse) => {
    if (!response.success) {
      console.error('API Error:', response);
      switch (response.error) {
        case 'DATA_NOT_FOUND':
          return 'Not Found';
        case 'BAD_REQUEST':
          return response.message || 'Invalid input provided';
        case 'ALREADY_EXISTS':
          return response.message || 'User already exists';
        case 'CONFLICT':
          return response.message || 'Please try again';
        case 'FORBIDDEN':
          return 'Access Denied';
        case 'UNAUTHORIZED':
          logout();
          return 'Please log in to continue';
        case 'MONGO_EXCEPTION':
          console.error('MongoDB Error Details:', response.details);
          return 'An error occurred';
        case 'DB_ERROR':
          return response.message || 'Database error occurred';
        case 'INTERNAL_SERVER_ERROR':
        default:
          return 'An unexpected error occurred';
      }
    }
    return null;
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://192.168.18.107:3000/rolepermission/api/v1/roles/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to fetch roles');
      }

      if (data.success && data.type === 1 && data.data) {
        setRoles((data.data as { data: Role[] }).data || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showMessage(errorMessage, false);
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to fetch users');
      }

      if (data.success && data.type === 1 && data.data) {
        const validUsers = ((data.data as { data: any[] }).data || []).map((user) => ({
          ...user,
          _id: user._id || user.user_id || '',
          role_id: user.role_id?._id || user.role_id || null,
        }));
        setUsers(validUsers);
        setFilteredUsers(validUsers);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching users';
      showMessage(errorMessage, false);
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      showMessage('Please fill in all required fields!', false);
      return;
    }
    setIsLoading(true);
    const userData: { [key: string]: any } = {
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      password: newUser.password.trim(),
      user_type: newUser.user_type,
      phone_number: newUser.phone_number.trim() || undefined,
      job_title: newUser.job_title.trim() || undefined,
      shift_time: newUser.shift_time.trim() || undefined,
      salary: newUser.salary ? parseFloat(newUser.salary) : undefined,
    };
    if (newUser.role_id) userData.role_id = newUser.role_id;

    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to create user');
      }

      if (data.success && data.type === 1 && data.data) {
        const newUserData = data.data as User;
        const updatedUsers = [...users, { ...newUserData, _id: newUserData._id || newUserData.user_id || '', role_id: newUserData.role_id || null }];
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setNewUser({
          name: '',
          email: '',
          password: '',
          user_type: 'worker',
          role_id: '',
          phone_number: '',
          job_title: '',
          shift_time: '',
          salary: '',
        });
        setIsCreateModalOpen(false);
        showMessage('User created successfully!', true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creating user';
      showMessage(errorMessage, false);
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) {
      showMessage('No user selected for editing!', false);
      return;
    }
    setIsLoading(true);
    const userData: { [key: string]: any } = {
      _id: editUser._id,
    };

    if (editUser.name !== originalUser?.name) userData.name = editUser.name.trim();
    if (editUser.email !== originalUser?.email) userData.email = editUser.email.trim();
    if (editUser.password) userData.password = editUser.password.trim();
    if (editUser.user_type !== originalUser?.user_type) userData.user_type = editUser.user_type;
    if (editUser.role_id !== originalUser?.role_id) userData.role_id = editUser.role_id || undefined;
    if (editUser.phone_number !== originalUser?.phone_number) userData.phone_number = editUser.phone_number?.trim() || undefined;
    if (editUser.job_title !== originalUser?.job_title) userData.job_title = editUser.job_title?.trim() || undefined;
    if (editUser.shift_time !== originalUser?.shift_time) userData.shift_time = editUser.shift_time?.trim() || undefined;
    if (editUser.salary !== originalUser?.salary) userData.salary = editUser.salary ? parseFloat(editUser.salary.toString()) : undefined;

    try {
      const response = await fetch(`http://192.168.18.107:3000/users/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to update user');
      }

      if (data.success && data.type === 1 && data.data) {
        const updatedUser = data.data as User;
        const updatedUsers = users.map((u) =>
          u._id === editUser._id ? { ...u, ...updatedUser, _id: u._id, role_id: updatedUser.role_id || null } : u
        );
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setEditUser(null);
        setOriginalUser(null);
        setIsEditModalOpen(false);
        showMessage('User updated successfully!', true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      showMessage(errorMessage, false);
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to delete user');
      }

      if (data.success) {
        const updatedUsers = users.filter((u) => u._id !== userId);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        showMessage('User deleted successfully!', true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error deleting user';
      showMessage(errorMessage, false);
      console.error('Error deleting user:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const openDeleteModal = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      handleDeleteUser(userToDelete);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRole.user_id || !assignRole.role_id) {
      showMessage('Please select a user and role!', false);
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://192.168.18.107:3000/users/api/v1/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: assignRole.user_id,
          role_id: assignRole.role_id,
        }),
      });
      const data: ApiResponse = await response.json();

      if (response.status === 401) {
        console.log('Unauthorized - logging out');
        logout();
        return;
      }

      if (!response.ok || !data.success) {
        const errorMessage = handleApiError(data);
        throw new Error(errorMessage || 'Failed to assign role');
      }

      if (
        data.success &&
        data.type === 1 &&
        data.data &&
        typeof data.data === 'object' &&
        'data' in data.data &&
        (data.data as { data: { user?: User } }).data?.user
      ) {
       const updatedUser = (data.data as { data: { user: User } }).data.user;
       const updatedUsers = users.map((user) =>
         user._id === assignRole.user_id
           ? { ...user, role_id: updatedUser.role_id || assignRole.role_id }
           : user
       );

        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setAssignRole({ user_id: '', role_id: '' });
        showMessage('Role assigned successfully!', true);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error assigning role';
      showMessage(errorMessage, false);
      console.error('Error assigning role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (msg: string, success: boolean) => {
    setMessage(msg);
    setIsSuccess(success);
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New User
          </button>
        </div>

        {/* Modal for Create User */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Email Address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Password"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
                    <input
                      type="text"
                      value="Worker"
                      disabled
                      className="w-full p-3 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role (Optional)</label>
                    <select
                      value={newUser.role_id}
                      onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                    >
                      <option value="">Select Role</option>
                      {Array.isArray(roles) && roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={newUser.phone_number}
                      onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title (Optional)</label>
                    <input
                      type="text"
                      value={newUser.job_title}
                      onChange={(e) => setNewUser({ ...newUser, job_title: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Job Title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Time (Optional)</label>
                    <input
                      type="text"
                      value={newUser.shift_time}
                      onChange={(e) => setNewUser({ ...newUser, shift_time: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Shift Time"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary (Optional)</label>
                    <input
                      type="number"
                      value={newUser.salary}
                      onChange={(e) => setNewUser({ ...newUser, salary: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Salary"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-400 flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Edit User */}
        {isEditModalOpen && editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit User</h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setOriginalUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={editUser.name}
                      onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Email Address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password (Optional)</label>
                    <input
                      type="password"
                      value={editUser.password || ''}
                      onChange={(e) => setEditUser({ ...editUser, password: e.target.value || undefined })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
                    <input
                      type="text"
                      value="Worker"
                      disabled
                      className="w-full p-3 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role (Optional)</label>
                    <select
                      value={editUser.role_id || ''}
                      onChange={(e) => setEditUser({ ...editUser, role_id: e.target.value || null })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                    >
                      <option value="">Select Role</option>
                      {Array.isArray(roles) && roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={editUser.phone_number || ''}
                      onChange={(e) => setEditUser({ ...editUser, phone_number: e.target.value || undefined })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title (Optional)</label>
                    <input
                      type="text"
                      value={editUser.job_title || ''}
                      onChange={(e) => setEditUser({ ...editUser, job_title: e.target.value || undefined })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Job Title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Time (Optional)</label>
                    <input
                      type="text"
                      value={editUser.shift_time || ''}
                      onChange={(e) => setEditUser({ ...editUser, shift_time: e.target.value || undefined })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Shift Time"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salary (Optional)</label>
                    <input
                      type="number"
                      value={editUser.salary || ''}
                      onChange={(e) => setEditUser({ ...editUser, salary: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                      placeholder="Salary"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setOriginalUser(null);
                    }}
                    className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-400 flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Delete Confirmation */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-96 max-w-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Role Form */}
        <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Assign Role to User</h3>
          <form onSubmit={handleAssignRole} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select User</label>
                <select
                  value={assignRole.user_id || ''}
                  onChange={(e) => setAssignRole({ ...assignRole, user_id: e.target.value })}
                  className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-500"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
                <select
                  value={assignRole.role_id || ''}
                  onChange={(e) => setAssignRole({ ...assignRole, role_id: e.target.value })}
                  className="w-full p-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-500"
                  required
                >
                  <option value="">Select Role</option>
                  {Array.isArray(roles) && roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-400 flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
                  </svg>
                  Assigning...
                </>
              ) : (
                'Assign Role'
              )}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Existing Users</h3>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="w-full sm:w-80 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Users</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 pl-10 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors border border-gray-300 dark:border-gray-600"
                  placeholder="Search by name, email, or role..."
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`px-4 py-2 text-sm rounded-lg ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                    } transition-colors duration-200`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          {currentUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs font-semibold">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Role</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    user && user._id ? (
                      <tr
                        key={user._id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150"
                      >
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{user.name || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{user.email || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">{user.user_type || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-900 dark:text-gray-200">
                          {roles.find((role) => role._id === user.role_id)?.name || 'N/A'}
                        </td>
                        <td className="py-4 px-6 flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setEditUser({ ...user, password: '' });
                              setOriginalUser(user);
                              setIsEditModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                            title="Edit User"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user._id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            disabled={isLoading}
                            title="Delete User"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ) : null
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`fixed bottom-6 right-6 p-4 rounded-lg shadow-xl text-sm flex items-center space-x-3 animate-slide-in-right ${
              isSuccess ? 'bg-green-600 dark:bg-green-700 text-white' : 'bg-red-600 dark:bg-red-700 text-white'
            }`}
          >
            {isSuccess ? (
              <CheckCircleIcon className="w-6 h-6" />
            ) : (
              <ExclamationCircleIcon className="w-6 h-6" />
            )}
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="ml-2 text-white hover:opacity-80 transition-opacity"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Custom Animation for Toast */}
      <style jsx>{`
        @keyframes slide-in-right {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UsersTemplate;
