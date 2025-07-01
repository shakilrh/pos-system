import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { fetchRoles } from '../../services/RoleService';
import { updateRolePermissions } from '../../services/PermissionService';
import { RolePermissionsProps } from './permissionsTypes';

const RolePermissions: React.FC<RolePermissionsProps> = ({
                                                           token,
                                                           logout,
                                                           roles,
                                                           permissions,
                                                           selectedRole,
                                                           setSelectedRole,
                                                           rolePermissions,
                                                           setRolePermissions,
                                                           setMessage,
                                                           setIsSuccess,
                                                           isLoading,
                                                           setIsLoading,
                                                         }) => {
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions((prev) =>
      checked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId)
    );
  };

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) {
      setMessage('Please select a role first!');
      setIsSuccess(false);
      return;
    }

    setIsLoading((prev) => ({ ...prev, roleUpdate: true }));
    try {
      const role = roles.find((r) => r._id === selectedRole);
      if (!role) throw new Error('Role not found');

      const currentPermissions = role.permissions.map((p) => p._id);
      const add_permission_ids = rolePermissions.filter((id) => !currentPermissions.includes(id));
      const remove_permission_ids = currentPermissions.filter((id) => !rolePermissions.includes(id));

      await updateRolePermissions(token!, logout, selectedRole, add_permission_ids, remove_permission_ids);

      const updatedRoles = await fetchRoles(token!, logout);
      roles.splice(0, roles.length, ...updatedRoles); // Update roles in parent state
      setSelectedRole(null);
      setRolePermissions([]);
      setMessage('Role permissions updated successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update role permissions');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, roleUpdate: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Permissions to Roles</h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Role
          </label>
          <select
            value={selectedRole || ''}
            onChange={(e) => {
              const roleId = e.target.value;
              const role = roles.find((r) => r._id === roleId);
              setRolePermissions(role?.permissions.map((p) => p._id) || []);
              setSelectedRole(roleId);
            }}
            className="w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Choose a role</option>
            {Array.isArray(roles) &&
              roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name} ({role.permissions?.length || 0} permissions)
                </option>
              ))}
          </select>
        </div>

        {selectedRole && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Permissions for "{roles.find((r) => r._id === selectedRole)?.name}"
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {rolePermissions.length} of {permissions.length} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
              <div className="p-3 space-y-2">
                {permissions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No permissions available
                  </p>
                ) : (
                  permissions.map((permission) => (
                    <div
                      key={permission._id}
                      className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission._id)}
                        onChange={(e) => handlePermissionToggle(permission._id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 mt-0.5"
                        disabled={isLoading.roleUpdate}
                      />
                      <div className="flex-1 min-w-0">
                        <label className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                          {permission.key}
                        </label>
                        {permission.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={handleUpdateRolePermissions}
              disabled={isLoading.roleUpdate}
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isLoading.roleUpdate ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
              ) : (
                'Update Role Permissions'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermissions;
