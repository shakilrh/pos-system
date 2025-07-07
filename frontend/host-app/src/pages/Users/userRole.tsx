import React, { useState } from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { assignRole } from '../../services/UserService';
import { User, Role } from './userTypes';

interface UserRoleProps {
  token: string | null;
  logout: () => void;
  users: User[];
  roles: Role[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setMessage: (msg: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  isLoading: { assign: boolean };
  setIsLoading: React.Dispatch<React.SetStateAction<{ assign: boolean }>>;
}

const UserRole: React.FC<UserRoleProps> = ({
                                             token,
                                             logout,
                                             users,
                                             roles,
                                             setUsers,
                                             setFilteredUsers,
                                             setMessage,
                                             setIsSuccess,
                                             isLoading,
                                             setIsLoading,
                                           }) => {
  const [assignRoleData, setAssignRoleData] = useState({ user_id: '', role_id: '' });

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignRoleData.user_id || !assignRoleData.role_id) {
      setMessage('Please select a user and role!');
      setIsSuccess(false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, assign: true }));
    try {
      const updatedUser = await assignRole(token!, logout, assignRoleData.user_id, assignRoleData.role_id);
      setUsers((prev) => prev.map((user) => (user._id === assignRoleData.user_id ? updatedUser : user)));
      setFilteredUsers((prev) => prev.map((user) => (user._id === assignRoleData.user_id ? updatedUser : user)));
      setAssignRoleData({ user_id: '', role_id: '' });
      setMessage('Role assigned successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to assign role');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, assign: false }));
    }
  };

  return (
    <div className="rounded-md shadow-md border" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center space-x-2">
          <UserIcon className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Assign Role to User</h3>
        </div>
      </div>
      <div className="p-4">
        <form onSubmit={handleAssignRole} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Select User *</label>
              <select
                value={assignRoleData.user_id}
                onChange={(e) => setAssignRoleData({ ...assignRoleData, user_id: e.target.value })}
                className="w-full p-2 text-sm rounded-md border focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  outlineColor: 'var(--focus-ring)'
                }}
                required
              >
                <option value="" disabled>Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Select Role *</label>
              <select
                value={assignRoleData.role_id}
                onChange={(e) => setAssignRoleData({ ...assignRoleData, role_id: e.target.value })}
                className="w-full p-2 text-sm rounded-md border focus:ring-2"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  outlineColor: 'var(--focus-ring)'
                }}
                required
              >
                <option value="" disabled>Select Role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading.assign}
              className="px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200"
              style={{
                backgroundColor: isLoading.assign ? 'var(--primary-600)' : 'var(--primary-color)',
                color: 'var(--text-on-primary)',
                cursor: isLoading.assign ? 'not-allowed' : 'pointer',
                '--tw-ring-color': 'var(--focus-ring)'
              } as React.CSSProperties}
            >
              {isLoading.assign ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{color: 'var(--text-on-primary)'}}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </span>
              ) : (
                'Assign Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRole;