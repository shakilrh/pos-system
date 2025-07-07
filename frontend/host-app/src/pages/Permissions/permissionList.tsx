import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, KeyIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Permission, PermissionListProps } from './permissionsTypes';

interface GroupedPermission {
  id: string;
  key: string;
  description?: string;
  isMainPage: boolean;
  subPermissions?: Permission[];
}

const PermissionList: React.FC<PermissionListProps> = ({
                                                         permissions,
                                                         setEditPermission,
                                                         handleDeletePermission,
                                                         isLoading,
                                                         setDeleteConfirm,
                                                         searchQuery,
                                                         setSearchQuery,
                                                         currentPage,
                                                         setCurrentPage,
                                                       }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const permissionsPerPage = 6;

  // Group permissions by parent (those with _access) and their sub-permissions
  const groupedPermissions = useMemo(() => {
    const groups: GroupedPermission[] = [];
    const ungroupedPermissions: Permission[] = [];

    // Identify parent permissions (those containing '_access')
    const parentPermissions = permissions.filter(p => p.key && p.key.toLowerCase().includes('_access'));

    // Create groups for parent permissions
    parentPermissions.forEach(parent => {
      const prefix = parent.key.toLowerCase().replace('_access', '');
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
      if (!permission.key || !permission.key.toLowerCase().includes('_access')) {
        let assigned = false;
        for (const group of groups) {
          const prefix = group.key.toLowerCase().replace('_access', '');
          if (permission.key && permission.key.toLowerCase().startsWith(prefix)) {
            group.subPermissions!.push(permission);
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          ungroupedPermissions.push(permission);
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

  // Filter grouped permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery) return groupedPermissions;

    return groupedPermissions
      .map(group => {
        const groupMatches =
          group.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const filteredSubPermissions = group.subPermissions?.filter(sub =>
          sub.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];

        if (groupMatches || filteredSubPermissions.length > 0) {
          return {
            ...group,
            subPermissions: filteredSubPermissions
          };
        }
        return null;
      })
      .filter(Boolean) as GroupedPermission[];
  }, [groupedPermissions, searchQuery]);

  // Pagination logic for grouped permissions
  const indexOfLastGroup = currentPage * permissionsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - permissionsPerPage;
  const currentGroups = filteredPermissions.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(filteredPermissions.length / permissionsPerPage);

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

  const handlePermissionClick = (permission: Permission) => {
    setSelectedPermission(permission);
  };

  const closeModal = () => {
    setSelectedPermission(null);
  };

  return (
    <div className="p-6 bg-[--background-color] text-[--text-color] rounded-lg shadow-lg border border-[--border-color]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <label className="block text-sm font-medium text-[--text-secondary] mb-2">Search Permissions</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-10 text-sm rounded-lg border border-[--border-color] bg-[--background-color] text-[--text-color] focus:ring-2 focus:ring-[--focus-ring] transition-colors duration-200"
              placeholder="Search by key or description..."
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-[--text-secondary] absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpandedGroups(new Set(filteredPermissions.map(group => group.id)))}
            className="text-sm text-[--info-color] hover:opacity-80"
          >
            Expand All
          </button>
          <span className="text-[--border-color]">|</span>
          <button
            onClick={() => setExpandedGroups(new Set())}
            className="text-sm text-[--info-color] hover:opacity-80"
          >
            Collapse All
          </button>
        </div>
      </div>

      {isLoading.fetch ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse h-12 bg-[--background-secondary] rounded-lg"></div>
          ))}
        </div>
      ) : filteredPermissions.length === 0 ? (
        <div className="text-center py-10">
          <KeyIcon className="w-12 h-12 text-[--text-secondary] mx-auto mb-4" />
          <p className="text-sm text-[--text-secondary]">No permissions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentGroups.map(group => (
            <div key={group.id} className="border border-[--border-color] rounded-lg bg-[--surface-color]">
              <div className="p-3 border-b border-[--border-color] bg-[--background-secondary] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center space-x-2 text-sm font-medium text-[--primary-color] hover:opacity-80"
                  >
                    {expandedGroups.has(group.id) ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                    <span>{group.key}</span>
                  </button>
                  {group.isMainPage && (
                    <span className="text-xs text-[--info-color]">(Main Access)</span>
                  )}
                </div>
                {group.isMainPage && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setEditPermission({ _id: group.id, key: group.key, description: group.description })}
                      className="text-[--primary-color] hover:opacity-80"
                      title="Edit permission"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(group.id)}
                      disabled={isLoading.delete === group.id}
                      className="text-[--error-color] hover:text-[--error-color-hover] disabled:opacity-50"
                      title="Delete permission"
                    >
                      {isLoading.delete === group.id ? (
                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {expandedGroups.has(group.id) && group.subPermissions && group.subPermissions.length > 0 && (
                <div className="p-3 space-y-2">
                  {group.subPermissions.map(permission => (
                    <div
                      key={permission._id}
                      className="flex items-center justify-between p-2 bg-[--surface-secondary] rounded-md ml-4 border-l-2 border-[--border-color]"
                    >
                      <div
                        className="text-sm text-[--text-color] cursor-pointer hover:underline"
                        onClick={() => handlePermissionClick(permission)}
                      >
                        {permission.key || 'N/A'}
                        {permission.description && (
                          <p className="text-xs text-[--text-secondary] mt-1">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setEditPermission(permission)}
                          className="text-[--primary-color] hover:opacity-80"
                          title="Edit permission"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(permission._id)}
                          disabled={isLoading.delete === permission._id}
                          className="text-[--error-color] hover:text-[--error-color-hover] disabled:opacity-50"
                          title="Delete permission"
                        >
                          {isLoading.delete === permission._id ? (
                            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <TrashIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm rounded-lg bg-[--background-secondary] text-[--text-color] hover:bg-[--border-hover] disabled:opacity-50 transition-colors duration-200"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 text-sm rounded-lg ${
                currentPage === page
                  ? 'bg-[--primary-color] text-white'
                  : 'bg-[--background-secondary] text-[--text-color] hover:bg-[--border-hover]'
              } transition-colors duration-200`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm rounded-lg bg-[--background-secondary] text-[--text-color] hover:bg-[--border-hover] disabled:opacity-50 transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}

      {selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[--background-color] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[--border-color]">
            <div className="flex justify-between items-center mb-5 border-b border-[--border-color] pb-3">
              <h3 className="text-xl font-bold text-[--text-color]">Permission Details</h3>
              <button onClick={closeModal} className="text-[--text-secondary] hover:text-[--error-color]">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Key:</span>
                <span className="text-[--text-color]">{selectedPermission.key || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-[--text-secondary]">Description:</span>
                <span className="text-[--text-color]">{selectedPermission.description || 'N/A'}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[--primary-color] text-white rounded-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[--focus-ring] transition-colors duration-200"
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

export default PermissionList;