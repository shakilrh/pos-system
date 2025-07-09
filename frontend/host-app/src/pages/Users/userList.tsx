import React, { useState } from 'react';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, UserIcon, XMarkIcon,PlusIcon  } from '@heroicons/react/24/outline';
import { User, Role } from './userTypes';
import UserCrud from './userCrud';
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
  setShowCreateForm: (show: boolean) => void; // Add this prop
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
                                             setShowCreateForm, // Add this prop
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
    <div className="p-6 rounded-lg shadow-lg" style={{backgroundColor: 'var(--surface-color)'}}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-72">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)'}}>Search Users</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-10 text-sm rounded-lg border focus:ring-2 transition-colors duration-200"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
                outlineColor: 'var(--focus-ring)'
              }}
              placeholder="Search by name, email, or role..."
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{color: 'var(--text-tertiary)'}} />
          </div>
        </div>
        {/* Add the Add User button here */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-1 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 self-end"
          style={{
            backgroundColor: 'var(--primary-color)',
            '--tw-ring-color': 'var(--focus-ring)'
          } as React.CSSProperties}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {isLoading.fetch ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse h-12 rounded-lg" style={{backgroundColor: 'var(--background-secondary)'}}></div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-10">
          <UserIcon className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--text-tertiary)'}} />
          <p className="text-sm" style={{color: 'var(--text-secondary)'}}>No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{borderColor: 'var(--border-color)'}}>
            <thead style={{backgroundColor: 'var(--background-secondary)'}}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
            {currentUsers.map((user) => (
              <tr key={user._id} className="transition-colors duration-150" style={{'--tw-bg-opacity': '0.1', '&:hover': { backgroundColor: 'var(--primary-color)'}} as React.CSSProperties}>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer hover:underline"
                  style={{color: 'var(--primary-color)'}}
                  onClick={() => handleUserClick(user)}
                >
                  {user.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--text-color)'}}>{user.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--text-color)'}}>{user.user_type || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--text-color)'}}>{roles.find(r => r._id === user.role_id)?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditUser(user);
                      setOriginalUser(user);
                    }}
                    className="mr-4"
                    style={{color: 'var(--primary-color)'}}
                    title="Edit user"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user._id)}
                    disabled={isLoading.delete}
                    className="disabled:opacity-50"
                    style={{color: 'var(--error-color)'}}
                    title="Delete user"
                  >
                    {isLoading.delete ? (
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{color: 'var(--error-color)'}}>
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
            className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-color)' // Add border color for consistency
            }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                currentPage === page
                  ? 'text-white'
                  : ''
              }`}
              style={{
                backgroundColor: currentPage === page ? 'var(--primary-color)' : 'var(--background-secondary)',
                color: currentPage === page ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                borderColor: 'var(--border-color)' // Add border color for consistency
              }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
            style={{
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-color)' // Add border color for consistency
            }}
          >
            Next
          </button>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-4 w-full max-w-md mx-4 shadow-2xl border max-h-[70vh] overflow-y-auto" style={{backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)'}}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b" style={{borderColor: 'var(--border-color)'}}>
              <h3 className="text-lg font-bold" style={{color: 'var(--text-color)'}}>User Details</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-opacity-10 transition-colors duration-200"
                style={{color: 'var(--text-tertiary)', backgroundColor: 'transparent'}}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User Name */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                  Full Name
                </label>
                <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                  <span className="text-sm font-medium" style={{color: 'var(--text-color)'}}>
                    {selectedUser.name || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                  Email Address
                </label>
                <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                  <span className="text-sm" style={{color: 'var(--text-color)'}}>
                    {selectedUser.email || 'N/A'}
                  </span>
                </div>
              </div>

              {/* User Type & Role in same row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                    User Type
                  </label>
                  <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                    <span className="text-sm" style={{color: 'var(--text-color)'}}>
                      {selectedUser.user_type || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                    Role
                  </label>
                  <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                    <span className="text-sm" style={{color: 'var(--text-color)'}}>
                      {roles.find(r => r._id === selectedUser.role_id)?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone & Job Title in same row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                    Phone
                  </label>
                  <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                    <span className="text-sm" style={{color: 'var(--text-color)'}}>
                      {selectedUser.phone_number || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                    Job Title
                  </label>
                  <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                    <span className="text-sm" style={{color: 'var(--text-color)'}}>
                      {selectedUser.job_title || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift Time & Salary in same row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                    Shift Time
                  </label>
                  <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                    <span className="text-sm" style={{color: 'var(--text-color)'}}>
                      {selectedUser.shift_time || 'N/A'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{color: 'var(--text-secondary)'}}>
                    Salary
                  </label>
                  <div className="p-2 rounded-md border" style={{backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)'}}>
                    <span className="text-sm font-medium" style={{color: 'var(--primary-color)'}}>
                      {selectedUser.salary ? `$${selectedUser.salary.toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2 pt-3 border-t" style={{borderColor: 'var(--border-color)'}}>


            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
