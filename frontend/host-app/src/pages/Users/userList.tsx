import React from 'react';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, UserIcon, PlusIcon,XMarkIcon  } from '@heroicons/react/24/outline';
import { User, Role } from './userTypes';
import UserCrud from './userCrud';
import { useAuth } from '../../context/AuthContext';

interface UserListProps {
  token: string | null;
  logout: () => void;
  users: User[];
  roles: Role[];
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setMessage: (msg: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  isLoading: { fetch: boolean; create: boolean; update: boolean; delete: boolean };
  setIsLoading: React.Dispatch<React.SetStateAction<{ fetch: boolean; create: boolean; update: boolean; delete: boolean }>>;
  onCreateUser: (userData: Partial<User>) => Promise<void>;
  onUpdateUser: (userData: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  setEditUser: (user: User | null) => void;
  setOriginalUser: (user: User | null) => void;
  setDeleteUserId: (id: string | null) => void;
}

const UserList: React.FC<UserListProps> = ({
                                             token,
                                             logout,
                                             users,
                                             roles,
                                             searchQuery,
                                             setSearchQuery,
                                             currentPage,
                                             setCurrentPage,
                                             setUsers,
                                             setFilteredUsers,
                                             setMessage,
                                             setIsSuccess,
                                             isLoading,
                                             setIsLoading,
                                             onCreateUser,
                                             onUpdateUser,
                                             onDeleteUser,
                                             showCreateForm,
                                             setShowCreateForm,
                                             setEditUser,
                                             setOriginalUser,
                                             setDeleteUserId,
                                           }) => {
  const usersPerPage = 6;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const { userPermissions, permissionsLoaded } = useAuth();

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setEditUser(null);
    setOriginalUser(null);
    setDeleteUserId(null);
  };

  if (!permissionsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading permissions...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative z-0">
      {showCreateForm ? (
        <UserCrud
          token={token}
          logout={logout}
          users={users}
          roles={roles}
          setUsers={setUsers}
          setFilteredUsers={setFilteredUsers}
          showCreateForm={showCreateForm}
          setShowCreateForm={setShowCreateForm}
          editUser={null}
          setEditUser={setEditUser}
          originalUser={null}
          setOriginalUser={setOriginalUser}
          setMessage={setMessage}
          setIsSuccess={setIsSuccess}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onCreateUser={onCreateUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
          mode="create"
          deleteUserId={null}
          onCancel={resetForm}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="w-full sm:w-72">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Search Users</label>
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
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="Search by name, email, or role..."
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            </div>
            {userPermissions.includes('can_add_users') && (
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
            </button>)}
          </div>

          {isLoading.fetch ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, idx) => (
                <div key={idx} className="animate-pulse h-12 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}></div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <UserIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <thead style={{ backgroundColor: 'var(--background-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)' }}>
                {currentUsers.map((user) => (
                  <tr key={user._id} className="transition-colors duration-150">
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer hover:underline"
                      style={{ color: 'var(--primary-color)' }}
                      onClick={() => handleUserClick(user)}
                    >
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>{user.user_type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-color)' }}>{roles.find((r) => r._id === user.role_id)?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {userPermissions.includes('can_edit_users') && (
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setOriginalUser(user);
                        }}
                        className="mr-4"
                        style={{ color: 'var(--primary-color)' }}
                        title="Edit user"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>)}
                      {userPermissions.includes('can_delete_users') && (
                      <button
                        onClick={() => setDeleteUserId(user._id)}
                        disabled={isLoading.delete}
                        className="disabled:opacity-50"
                        style={{ color: 'var(--error-color)' }}
                        title="Delete user"
                      >
                        {isLoading.delete ? (
                          <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--error-color)' }}>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <TrashIcon className="w-5 h-5" />
                        )}
                      </button>)}
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
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${currentPage === page ? 'text-white' : ''}`}
                  style={{
                    backgroundColor: currentPage === page ? 'var(--primary-color)' : 'var(--background-secondary)',
                    color: currentPage === page ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedUser && !showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[--background-color] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[--border-color]">
            <div className="flex justify-between items-center mb-5 border-b border-[--border-color] pb-3">
              <h3 className="text-xl font-bold text-[--text-color]">User Details</h3>
              <button onClick={closeModal} className="text-[--text-secondary] hover:text-[--error-color]">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Full Name:</span>
                <span className="text-[--text-color]">{selectedUser.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Email Address:</span>
                <span className="text-[--text-color]">{selectedUser.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">User Type:</span>
                <span className="text-[--text-color]">{selectedUser.user_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Role:</span>
                <span className="text-[--text-color]">{roles.find((r) => r._id === selectedUser.role_id)?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Phone:</span>
                <span className="text-[--text-color]">{selectedUser.phone_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Job Title:</span>
                <span className="text-[--text-color]">{selectedUser.job_title || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Shift Time:</span>
                <span className="text-[--text-color]">{selectedUser.shift_time || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Salary:</span>
                <span className="text-[--text-color]">{selectedUser.salary ? `$${selectedUser.salary.toFixed(2)}` : 'N/A'}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
