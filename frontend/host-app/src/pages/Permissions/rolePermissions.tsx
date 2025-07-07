import React, { useState, useMemo } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { fetchRoles } from '../../services/RoleService';
import { updateRolePermissions } from '../../services/PermissionService';
import { RolePermissionsProps } from './permissionsTypes';

interface GroupedPermission {
  id: string;
  key: string;
  description?: string;
  isMainPage: boolean;
  subPermissions?: GroupedPermission[];
}

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
                                                         }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchical' | 'flat'>('hierarchical');

  // Group permissions by parent (those with _access) and their sub-permissions
  const groupedPermissions = useMemo(() => {
    const groups: GroupedPermission[] = [];
    const ungroupedPermissions: GroupedPermission[] = [];

    // Identify parent permissions (those containing '_access')
    const parentPermissions = permissions.filter(p => p.key.toLowerCase().includes('_access'));

    // Create groups for parent permissions
    parentPermissions.forEach(parent => {
      groups.push({
        id: parent._id,
        key: parent.key,
        description: parent.description,
        isMainPage: true,
        subPermissions: []
      });
    });

    // Categorize remaining permissions as sub-permissions
    permissions.forEach(permission => {
      if (!permission.key.toLowerCase().includes('_access')) {
        let assigned = false;

        for (const group of groups) {
          const prefix = group.key.toLowerCase().replace('_access', '');
          if (permission.key.toLowerCase().startsWith(prefix)) {
            group.subPermissions!.push({
              id: permission._id,
              key: permission.key,
              description: permission.description,
              isMainPage: false
            });
            assigned = true;
            break;
          }
        }

        if (!assigned) {
          ungroupedPermissions.push({
            id: permission._id,
            key: permission.key,
            description: permission.description,
            isMainPage: false
          });
        }
      }
    });

    // Add ungrouped permissions as a separate group
    if (ungroupedPermissions.length > 0) {
      groups.push({
        id: 'ungrouped',
        key: 'Other Permissions',
        description: 'Permissions not categorized under main pages',
        isMainPage: false,
        subPermissions: ungroupedPermissions
      });
    }

    return groups;
  }, [permissions]);

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return groupedPermissions;

    return groupedPermissions.map(group => {
      const groupMatches = group.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const filteredSubPermissions = group.subPermissions?.filter(sub =>
        sub.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) || [];

      if (groupMatches || filteredSubPermissions.length > 0) {
        return {
          ...group,
          subPermissions: filteredSubPermissions
        };
      }
      return null;
    }).filter(Boolean) as GroupedPermission[];
  }, [groupedPermissions, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRolePermissions((prev) =>
      checked ? [...prev, permissionId] : prev.filter((id) => id !== permissionId)
    );
  };

  const handleGroupToggle = (group: GroupedPermission, checked: boolean) => {
    const allIds = [group.id, ...(group.subPermissions?.map(sub => sub.id) || [])];

    setRolePermissions(prev => {
      if (checked) {
        const newIds = allIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      } else {
        return prev.filter(id => !allIds.includes(id));
      }
    });
  };

  const isGroupPartiallySelected = (group: GroupedPermission) => {
    const allIds = [group.id, ...(group.subPermissions?.map(sub => sub.id) || [])];
    const selectedIds = allIds.filter(id => rolePermissions.includes(id));
    return selectedIds.length > 0 && selectedIds.length < allIds.length;
  };

  const isGroupFullySelected = (group: GroupedPermission) => {
    const allIds = [group.id, ...(group.subPermissions?.map(sub => sub.id) || [])];
    return allIds.every(id => rolePermissions.includes(id));
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
      setIsLoading((prev) => ({ ...prev, roleUpdate: false }));
    }
  };

  const expandAll = () => {
    setExpandedGroups(new Set(filteredPermissions.map(group => group.id)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const selectedCount = rolePermissions.length;
  const totalCount = permissions.length;

  return (
    <div className="bg-[--background-color] text-[--text-color] rounded-lg shadow-md border border-[--border-color]">
      <div className="p-6 border-b border-[--border-color]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-6 h-6 text-[--primary-color]" />
            <h3 className="text-xl font-semibold">
              Assign Permissions to Roles
            </h3>
          </div>
          {selectedRole && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={expandAll}
                  className="text-sm text-[--primary-color] hover:text-[--primary-700]"
                >
                  Expand All
                </button>
                <span className="text-[--text-secondary]">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-[--primary-color] hover:text-[--primary-700]"
                >
                  Collapse All
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('hierarchical')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'hierarchical'
                      ? 'bg-[--primary-color] text-white'
                      : 'bg-[--background-secondary] text-[--text-color]'
                  }`}
                >
                  Hierarchical
                </button>
                <button
                  onClick={() => setViewMode('flat')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === 'flat'
                      ? 'bg-[--primary-color] text-white'
                      : 'bg-[--background-secondary] text-[--text-color]'
                  }`}
                >
                  Flat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[--text-color] mb-1">
              Select Role
            </label>
            <select
              value={selectedRole || ''}
              onChange={(e) => {
                const roleId = e.target.value;
                const role = roles.find((r) => r._id === roleId);
                setRolePermissions(role?.permissions.map((p) => p._id) || []);
                setSelectedRole(roleId);
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="w-full p-2.5 text-sm rounded-lg border border-[--border-color] bg-[--background-color] text-[--text-color] focus:ring-2 focus:ring-[--primary-color] transition-colors duration-200"
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
            <div className="relative">
              <label className="block text-sm font-medium text-[--text-color] mb-1">
                Search Permissions
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
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
                Permissions for "{roles.find((r) => r._id === selectedRole)?.name}"
              </h4>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-[--text-secondary]">
                  {selectedCount} of {totalCount} permissions selected
                </span>
                {selectedCount > 0 && (
                  <div className="w-24 bg-[--border-color] rounded-full h-2">
                    <div
                      className="bg-[--primary-color] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border border-[--border-color] rounded-lg bg-[--background-secondary]">
              {filteredPermissions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[--text-secondary]">
                    No permissions found matching your search.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {viewMode === 'hierarchical' ? (
                    filteredPermissions.map((group) => (
                      <div key={group.id} className="border border-[--border-color] rounded-lg bg-[--surface-color]">
                        <div className="p-3 border-b border-[--border-color] bg-[--surface-secondary]">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleGroup(group.id)}
                              className="flex items-center space-x-2 text-sm font-medium text-[--text-color] hover:text-[--primary-color]"
                            >
                              {expandedGroups.has(group.id) ? (
                                <ChevronDownIcon className="w-4 h-4" />
                              ) : (
                                <ChevronRightIcon className="w-4 h-4" />
                              )}
                              <span>{group.key}</span>
                            </button>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={isGroupFullySelected(group)}
                                ref={(el) => {
                                  if (el) el.indeterminate = isGroupPartiallySelected(group);
                                }}
                                onChange={(e) => handleGroupToggle(group, e.target.checked)}
                                className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color]"
                                disabled={isLoading.roleUpdate}
                              />
                              <span className="text-xs text-[--text-secondary]">
                                Select All ({1 + (group.subPermissions?.length || 0)})
                              </span>
                            </div>
                          </div>
                          {group.description && (
                            <p className="text-xs text-[--text-secondary] mt-1 ml-6">
                              {group.description}
                            </p>
                          )}
                        </div>

                        {expandedGroups.has(group.id) && (
                          <div className="p-3 space-y-2">
                            {group.isMainPage && (
                              <div className="flex items-start space-x-3 p-2 bg-[--info-color] bg-opacity-10 rounded-md border border-[--info-color] border-opacity-30">
                                <input
                                  type="checkbox"
                                  checked={rolePermissions.includes(group.id)}
                                  onChange={(e) => handlePermissionToggle(group.id, e.target.checked)}
                                  className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color] mt-0.5"
                                  disabled={isLoading.roleUpdate}
                                />
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-[--info-color] cursor-pointer">
                                    {group.key} (Main Access)
                                  </label>
                                  <p className="text-xs text-[--info-color] opacity-80 mt-1">
                                    Controls access to the main page/feature
                                  </p>
                                </div>
                              </div>
                            )}

                            {group.subPermissions?.map((subPermission) => (
                              <div
                                key={subPermission.id}
                                className="flex items-start space-x-3 p-2 bg-[--background-secondary] rounded-md ml-4 border-l-2 border-[--border-color]"
                              >
                                <input
                                  type="checkbox"
                                  checked={rolePermissions.includes(subPermission.id)}
                                  onChange={(e) => handlePermissionToggle(subPermission.id, e.target.checked)}
                                  className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color] mt-0.5"
                                  disabled={isLoading.roleUpdate}
                                />
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-[--text-color] cursor-pointer">
                                    {subPermission.key}
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
                    ))
                  ) : (
                    <div className="space-y-2">
                      {filteredPermissions.flatMap(group => [
                        group.isMainPage && (
                          <div
                            key={group.id}
                            className="flex items-start space-x-3 p-3 bg-[--info-color] bg-opacity-10 rounded-md border border-[--info-color] border-opacity-30"
                          >
                            <input
                              type="checkbox"
                              checked={rolePermissions.includes(group.id)}
                              onChange={(e) => handlePermissionToggle(group.id, e.target.checked)}
                              className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color] mt-0.5"
                              disabled={isLoading.roleUpdate}
                            />
                            <div className="flex-1">
                              <label className="text-sm font-medium text-[--info-color] cursor-pointer">
                                {group.key} (Main Access)
                              </label>
                              {group.description && (
                                <p className="text-xs text-[--info-color] opacity-80 mt-1">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ),
                        ...(group.subPermissions?.map(subPermission => (
                          <div
                            key={subPermission.id}
                            className="flex items-start space-x-3 p-3 bg-[--background-secondary] rounded-md"
                          >
                            <input
                              type="checkbox"
                              checked={rolePermissions.includes(subPermission.id)}
                              onChange={(e) => handlePermissionToggle(subPermission.id, e.target.checked)}
                              className="h-4 w-4 text-[--primary-color] border-[--border-color] rounded focus:ring-[--primary-color] mt-0.5"
                              disabled={isLoading.roleUpdate}
                            />
                            <div className="flex-1">
                              <label className="text-sm font-medium text-[--text-color] cursor-pointer">
                                {subPermission.key}
                              </label>
                              {subPermission.description && (
                                <p className="text-xs text-[--text-secondary] mt-1">
                                  {subPermission.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )) || [])
                      ]).filter(Boolean)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleUpdateRolePermissions}
              disabled={isLoading.roleUpdate}
              className="mt-6 w-full bg-[--primary-color] hover:bg-[--primary-600] disabled:bg-[--primary-color] disabled:opacity-50 text-white px-4 py-3 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[--focus-ring] transition-colors duration-200"
            >
              {isLoading.roleUpdate ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1. sincerity 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating Role Permissions...
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