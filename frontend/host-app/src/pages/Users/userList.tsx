import React, { useState } from 'react';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { User, Role } from './userTypes';

interface UserListProps {
  users: User[];
  roles: Role[];
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setEditUser: (user: User | null) => void;
  setOriginalUser: (user: User | null) => void;
  handleDeleteUser: (userId: string) => Promise<void>;
  isLoading: { fetch: boolean; delete: boolean };
  setDeleteConfirm: (id: string | null) => void;
}

const UserList: React.FC<UserListProps> = ({
                                             users,
                                             roles,
                                             searchQuery,
                                             setSearchQuery,
                                             currentPage,
                                             setCurrentPage,
                                             setEditUser,
                                             setOriginalUser,
                                             handleDeleteUser,
                                             isLoading,
                                             setDeleteConfirm,
                                           }) => {
  const usersPerPage = 6;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-72">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Users</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-10 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              placeholder="Search by name, email, or role..."
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
      </div>

      {isLoading.fetch ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentUsers.map((user) => (
              <tr key={user._id} className="hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-150">
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline"
                  onClick={() => handleUserClick(user)}
                >
                  {user.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{user.user_type || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{roles.find(r => r._id === user.role_id)?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditUser(user);
                      setOriginalUser(user);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                    title="Edit user"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    disabled={isLoading.delete}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                    title="Delete user"
                  >
                    {isLoading.delete ? (
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 text-sm rounded-lg ${
                currentPage === page
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
              } transition-colors duration-200`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-600 pb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.user_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                <span className="text-gray-900 dark:text-gray-100">{roles.find(r => r._id === selectedUser.role_id)?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.phone_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Job Title:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.job_title || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Shift Time:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.shift_time || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Salary:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.salary ? `$${selectedUser.salary.toFixed(2)}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                <span className="text-gray-900 dark:text-gray-100">{selectedUser.address || 'N/A'}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
