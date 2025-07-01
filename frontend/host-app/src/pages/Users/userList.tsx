import React from 'react';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
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
  isLoading: { fetch: boolean; delete: string };
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

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="w-full sm:w-64 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Users</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-8 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name, email, or role..."
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded-md ${currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isLoading.fetch ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse h-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">
          <UserIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currentUsers.map((user) => (
            <div
              key={user._id}
              className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{user.name || 'N/A'}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{user.email || 'N/A'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Type: {user.user_type || 'N/A'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Role: {roles.find((role) => role._id === user.role_id)?.name || 'N/A'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditUser({ ...user, password: '' });
                      setOriginalUser(user);
                    }}
                    className="p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Edit user"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    disabled={isLoading.delete === user._id}
                    className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                    title="Delete user"
                  >
                    {isLoading.delete === user._id ? (
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
