import React, { useState, useEffect, useMemo } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { fetchRoles } from '../../services/RoleService';
import { updateRolePermissions } from '../../services/PermissionService';
import { RolePermissionsProps } from './permissionsTypes';

interface Permission {
  _id: string;
  key: string;
  name: string;
  description: string;
}

interface MainPage {
  _id: string;
  key: string;
  name: string;
  description: string;
  permissions: Permission[];
}

interface GroupedPermission {
  id: string;
  key: string;
  description?: string;
  isMainPage: boolean;
  subPermissions?: Permission[];
}

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: { data?: MainPage[] };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const fetchMainPages = async (token: string, logout: () => void): Promise<MainPage[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/pages/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: ApiResponse = await response.json();

    if (response.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch main pages');
    }

    if (data.success && data.type === 1 && data.data && 'data' in data.data) {
      return (data.data as { data: MainPage[] }).data || [];
    }
    throw new Error('Invalid response format');
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to fetch main pages');
  }
};

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
                                                           searchQuery,
                                                           setSearchQuery,
                                                           currentPage,
                                                           setCurrentPage,
                                                           setActiveSection,
                                                           fromEdit = false,
                                                         }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [mainPages, setMainPages] = useState<MainPage[]>([]);

  useEffect(() => {
    const loadMainPages = async () => {
      try {
        const pages = await fetchMainPages(token!, logout);
        setMainPages(pages);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Failed to load main pages');
        setIsSuccess(false);
      }
    };
    if (token) {
      loadMainPages();
    }
  }, [token, logout, setMessage, setIsSuccess]);

  useEffect(() => {
    if (selectedRole) {
      const role = roles.find(r => r._id === selectedRole);
      if (role) {
        setRolePermissions(role.permissions.map(p => p._id) || []);
      }
    } else {
      setRolePermissions([]);
    }
    setSearchQuery('');
    setCurrentPage(1);
    setExpandedGroup(null);
  }, [selectedRole, roles, setRolePermissions, setSearchQuery, setCurrentPage]);

  const groupedPermissions = useMemo(() => {
    const groups: GroupedPermission[] = [];

    const mainPagePermissionIds = new Set<string>();
    mainPages.forEach(page => {
      page.permissions.forEach(permission => {
        mainPagePermissionIds.add(permission._id);
      });
    });

    const mainPageAccessKeys = new Set<string>(mainPages.map(page => page.key));

    const ungroupedPermissions: Permission[] = permissions.filter(p => {
      if (mainPagePermissionIds.has(p._id)) {
        return false;
      }
      if (mainPageAccessKeys.has(p.key)) {
        return false;
      }
      return true;
    }).map(p => ({
      _id: p._id,
      key: p.key,
      name: p.key,
      description: p.description || ''
    }));

    mainPages.forEach(page => {
      groups.push({
        id: page._id,
        key: page.name,
        description: page.description,
        isMainPage: true,
        subPermissions: page.permissions,
      });
    });

    if (ungroupedPermissions.length > 0) {
      groups.push({
        id: 'ungrouped',
        key: 'Other Permissions',
        description: 'Permissions not categorized under main pages',
        isMainPage: false,
        subPermissions: ungroupedPermissions,
      });
    }

    return groups;
  }, [mainPages, permissions]);

  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return groupedPermissions;

    return groupedPermissions
        .map(group => {
          const groupMatches =
              group.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
              group.description?.toLowerCase().includes(searchQuery.toLowerCase());

          const filteredSubPermissions = group.subPermissions?.filter(sub =>
              sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
          ) || [];

          if (groupMatches || filteredSubPermissions.length > 0) {
            return {
              ...group,
              subPermissions: filteredSubPermissions,
            };
          }
          return null;
        })
        .filter(Boolean) as GroupedPermission[];
  }, [groupedPermissions, searchQuery]);

  const totalAvailablePermissions = useMemo(() => {
    return groupedPermissions.reduce((total, group) => {
      return total + (group.subPermissions?.length || 0);
    }, 0);
  }, [groupedPermissions]);

  const assignedPermissionNames = useMemo(() => {
    const names: string[] = [];
    groupedPermissions.forEach(group => {
      group.subPermissions?.forEach(permission => {
        if (rolePermissions.includes(permission._id)) {
          names.push(permission.name);
        }
      });
    });
    return names;
  }, [groupedPermissions, rolePermissions]);

  const getGroupAssignedCount = (group: GroupedPermission) => {
    if (!group.subPermissions) return 0;
    return group.subPermissions.filter(permission =>
        rolePermissions.includes(permission._id)
    ).length;
  };

  const isGroupFullySelected = (group: GroupedPermission) => {
    if (!group.subPermissions || group.subPermissions.length === 0) return false;
    return group.subPermissions.every(permission =>
        rolePermissions.includes(permission._id)
    );
  };

  const isGroupPartiallySelected = (group: GroupedPermission) => {
    if (!group.subPermissions || group.subPermissions.length === 0) return false;
    const selectedCount = getGroupAssignedCount(group);
    return selectedCount > 0 && selectedCount < group.subPermissions.length;
  };

  const handleGroupToggle = (group: GroupedPermission, checked: boolean) => {
    if (!group.subPermissions) return;

    const permissionIds = group.subPermissions.map(p => p._id);

    setRolePermissions(prev => {
      if (checked) {
        const newPermissions = permissionIds.filter(id => !prev.includes(id));
        return [...prev, ...newPermissions];
      } else {
        return prev.filter(id => !permissionIds.includes(id));
      }
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prev => (prev === groupId ? null : groupId));
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions(prev =>
        checked ? [...prev, permissionId] : prev.filter(id => id !== permissionId)
    );
  };

  const handleCancel = () => {
    setSelectedRole(null);
    setRolePermissions([]);
    setSearchQuery('');
    setCurrentPage(1);
    setExpandedGroup(null);
    setActiveSection('list');
  };

  const handleUpdateRolePermissions = async () => {
    if (!selectedRole) {
      setMessage('Please select a role first!');
      setIsSuccess(false);
      return;
    }

    setIsLoading(prev => ({ ...prev, roleUpdate: true }));
    try {
      const role = roles.find(r => r._id === selectedRole);
      if (!role) throw new Error('Role not found');

      const currentPermissions = role.permissions.map(p => p._id);
      const add_permission_ids = rolePermissions.filter(id => !currentPermissions.includes(id));
      const remove_permission_ids = currentPermissions.filter(id => !rolePermissions.includes(id));

      await updateRolePermissions(token!, logout, selectedRole, add_permission_ids, remove_permission_ids);

      const updatedRoles = await fetchRoles(token!, logout);
      roles.splice(0, roles.length, ...updatedRoles);
      setSelectedRole(null);
      setRolePermissions([]);
      setSearchQuery('');
      setCurrentPage(1);
      setActiveSection('list');
      setMessage('Role permissions updated successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update role permissions');
      setIsSuccess(false);
    } finally {
      setIsLoading(prev => ({ ...prev, roleUpdate: false }));
    }
  };

  const expandAll = () => {
    if (filteredPermissions.length > 0) {
      setExpandedGroup(filteredPermissions[0].id);
    }
  };

  const collapseAll = () => {
    setExpandedGroup(null);
  };

  const selectedCount = rolePermissions.length;

  return (
      <div className="bg-[--background-color] text-[--text-color] rounded-lg shadow-md border border-[--border-color]">
        <div className="p-6 border-b border-[--border-color]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="w-6 h-6 text-[--primary-color]" />
              <h3 className="text-xl font-semibold">Assign Permissions to Roles</h3>
            </div>
            {selectedRole && (
                <div className="flex items-center space-x-3">
                  <button
                      onClick={expandAll}
                      className="text-sm text-[--primary-color] hover:text-[--primary-700]"
                  >
                    Expand All
                  </button>
                  <button
                      onClick={collapseAll}
                      className="text-sm text-[--primary-color] hover:text-[--primary-700]"
                  >
                    Collapse All
                  </button>
                </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!fromEdit && (
                <div>
                  <label className="block text-sm font-medium text-[--text-color] mb-1">Select Role</label>
                  <select
                      value={selectedRole || ''}
                      onChange={e => {
                        const roleId = e.target.value;
                        setSelectedRole(roleId);
                      }}
                      className="w-full p-2.5 text-sm rounded-lg border border-[--border-color] bg-[--background-color] text-[--text-color] focus:ring-2 focus:ring-[--primary-color] transition-colors duration-200"
                  >
                    <option value="">Choose a role</option>
                    {Array.isArray(roles) &&
                        roles.map(role => (
                            <option key={role._id} value={role._id}>
                              {role.name} ({role.permissions?.length || 0} permissions)
                            </option>
                        ))}
                  </select>
                </div>
            )}

            {selectedRole && (
                <div className={fromEdit ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-[--text-color] mb-1">Search Permissions</label>
                  <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full p-2.5 pl-10 text-sm rounded-lg border border-[--border-color] bg-[--background-color] text-[--text-color] focus:ring-2 focus:ring-[--primary-color] transition-colors duration-200"
                        placeholder="Search by key or description..."
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-[--text-secondary] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
            )}
          </div>

          {selectedRole && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-[--text-color]">
                    Permissions for "{roles.find(r => r._id === selectedRole)?.name}"
                  </h4>
                  <div className="flex items-center space-x-4">
                <span className="text-sm text-[--text-secondary]">
                  {selectedCount} of {totalAvailablePermissions} permissions selected
                </span>
                    {selectedCount > 0 && (
                        <div className="w-24 bg-[--border-color] rounded-full h-2">
                          <div
                              className="bg-[--primary-color] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(selectedCount / totalAvailablePermissions) * 100}%` }}
                          />
                        </div>
                    )}
                  </div>
                </div>

                {assignedPermissionNames.length > 0 && (
                    <div className="mb-4 p-4 bg-[--surface-color] rounded-lg border border-[--border-color]">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <h5 className="text-sm font-medium text-[--text-color]">
                          Assigned Permissions ({assignedPermissionNames.length})
                        </h5>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignedPermissionNames.map((name, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                            >
                      {name}
                    </span>
                        ))}
                      </div>
                    </div>
                )}

                <div className="max-h-96 overflow-y-auto border border-[--border-color] rounded-lg bg-[--background-secondary]">
                  {filteredPermissions.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-[--text-secondary]">No permissions found matching your search.</p>
                      </div>
                  ) : (
                      <div className="p-4 space-y-3">
                        {filteredPermissions.map(group => {
                          const assignedCount = getGroupAssignedCount(group);
                          const totalCount = group.subPermissions?.length || 0;
                          const isFullySelected = isGroupFullySelected(group);
                          const isPartiallySelected = isGroupPartiallySelected(group);

                          return (
                              <div key={group.id} className="border border-[--border-color] rounded-lg bg-[--surface-color]">
                                {group.isMainPage ? (
                                    <div className="p-3 border-b border-[--border-color] bg-[--surface-secondary]">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <input
                                              type="checkbox"
                                              checked={isFullySelected}
                                              ref={(input) => {
                                                if (input) input.indeterminate = isPartiallySelected;
                                              }}
                                              onChange={e => handleGroupToggle(group, e.target.checked)}
                                              className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color]"
                                              disabled={isLoading.roleUpdate}
                                              title={isFullySelected ? "Unselect all" : isPartiallySelected ? "Select all" : "Select all"}
                                          />
                                          <button
                                              onClick={() => toggleGroup(group.id)}
                                              className="flex items-center space-x-2 text-sm font-medium text-[--text-color] hover:text-[--primary-color]"
                                          >
                                            {expandedGroup === group.id ? (
                                                <ChevronDownIcon className="w-4 h-4" />
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4" />
                                            )}
                                            <span>{group.key}</span>
                                          </button>
                                          <span className="text-xs text-[--info-color]">(Main Page)</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                <span className="text-xs text-[--text-secondary]">
                                  {assignedCount}/{totalCount} assigned
                                </span>
                                          {assignedCount > 0 && (
                                              <div className="w-16 bg-[--border-color] rounded-full h-1.5">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${(assignedCount / totalCount) * 100}%` }}
                                                />
                                              </div>
                                          )}
                                        </div>
                                      </div>
                                      {group.description && (
                                          <p className="text-xs text-[--text-secondary] mt-1 ml-6">{group.description}</p>
                                      )}
                                    </div>
                                ) : (
                                    <div className="p-3 border-b border-[--border-color] bg-[--surface-secondary]">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <input
                                              type="checkbox"
                                              checked={isFullySelected}
                                              ref={(input) => {
                                                if (input) input.indeterminate = isPartiallySelected;
                                              }}
                                              onChange={e => handleGroupToggle(group, e.target.checked)}
                                              className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color]"
                                              disabled={isLoading.roleUpdate}
                                              title={isFullySelected ? "Unselect all" : isPartiallySelected ? "Select all" : "Select all"}
                                          />
                                          <button
                                              onClick={() => toggleGroup(group.id)}
                                              className="flex items-center space-x-2 text-sm font-medium text-[--text-color] hover:text-[--primary-color]"
                                          >
                                            {expandedGroup === group.id ? (
                                                <ChevronDownIcon className="w-4 h-4" />
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4" />
                                            )}
                                            <span>{group.key}</span>
                                          </button>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                <span className="text-xs text-[--text-secondary]">
                                  {assignedCount}/{totalCount} assigned
                                </span>
                                          {assignedCount > 0 && (
                                              <div className="w-16 bg-[--border-color] rounded-full h-1.5">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${(assignedCount / totalCount) * 100}%` }}
                                                />
                                              </div>
                                          )}
                                        </div>
                                      </div>
                                      {group.description && (
                                          <p className="text-xs text-[--text-secondary] mt-1 ml-6">{group.description}</p>
                                      )}
                                    </div>
                                )}

                                {expandedGroup === group.id && group.subPermissions && group.subPermissions.length > 0 && (
                                    <div className="p-3 space-y-2">
                                      {group.subPermissions.map(subPermission => (
                                          <div
                                              key={subPermission._id}
                                              className="flex items-start space-x-3 p-2 bg-[--background-secondary] rounded-md ml-4 border-l-2 border-[--border-color]"
                                          >
                                            <input
                                                type="checkbox"
                                                checked={rolePermissions.includes(subPermission._id)}
                                                onChange={e => handlePermissionToggle(subPermission._id, e.target.checked)}
                                                className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color] mt-0.5"
                                                disabled={isLoading.roleUpdate}
                                            />
                                            <div className="flex-1">
                                              <label className="text-sm font-medium text-[--text-color] cursor-pointer">
                                                {subPermission.name}
                                              </label>
                                              {subPermission.description && (
                                                  <p className="text-xs text-[--text-secondary] mt-1">
                                                    {subPermission.description}
                                                  </p>
                                              )}
                                            </div>
                                          </div>
                                      ))}
                                    </div>
                                )}
                              </div>
                          );
                        })}
                      </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                      onClick={handleUpdateRolePermissions}
                      disabled={isLoading.roleUpdate}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${
                          isLoading.roleUpdate
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-[--primary-color] text-white'
                      }`}
                      style={{
                        cursor: isLoading.roleUpdate ? 'not-allowed' : 'pointer',
                        '--tw-ring-color': 'var(--focus-ring)'
                      }}
                  >
                    {isLoading.roleUpdate ? (
                        <span className="flex items-center justify-center">
      <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-on-primary)' }}
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Assigning Permissions...
    </span>
                    ) : (
                        'Assign Role Permissions'
                    )}
                  </button>

                  <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading.roleUpdate}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${
                          isLoading.roleUpdate ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                        cursor: isLoading.roleUpdate ? 'not-allowed' : 'pointer',
                        '--tw-ring-color': 'var(--focus-ring)'
                      }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default RolePermissions;