import React, { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, KeyIcon, XMarkIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Permission, PermissionListProps } from './permissionsTypes';

interface GroupedPermission {
  id: string;
  key: string;
  description?: string;
  isMainPage: boolean;
  subPermissions?: Permission[];
}

const MAIN_PAGES = [
  { key: 'dashboard_access', name: 'Dashboard', description: 'Access to Dashboard page' },
  { key: 'menu_management_access', name: 'Menu Management', description: 'Access to Menu Management page' },
  { key: 'orders_access', name: 'Orders', description: 'Access to Orders page' },
  { key: 'roles_management_access', name: 'Roles Management', description: 'Access to Roles Management page' },
  { key: 'tables_management_access', name: 'Tables Management', description: 'Access to Tables Management page' },
  { key: 'settings_access', name: 'Settings', description: 'Access to Settings page' },
];

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
                                                         setShowCreateForm,
                                                       }) => {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const permissionsPerPage = 6;

  const groupedPermissions = useMemo(() => {
    const groups: GroupedPermission[] = [];
    const ungroupedPermissions: Permission[] = [];

    MAIN_PAGES.forEach(page => {
      groups.push({
        id: page.key,
        key: page.name,
        description: page.description,
        isMainPage: true,
        subPermissions: [],
      });
    });

    permissions.forEach(permission => {
      let assigned = false;
      if (!permission.key) {
        ungroupedPermissions.push(permission);
        return;
      }
      for (const group of groups) {
        if (
          (group.key === 'Dashboard' && (permission.key.toLowerCase().startsWith('dashboard_') || permission.key.toLowerCase() === 'can_view_dashboard')) ||
          (group.key === 'Menu Management' &&
            (permission.key.toLowerCase().startsWith('can_view_menu') ||
              permission.key.toLowerCase().startsWith('can_add_categories') ||
              permission.key.toLowerCase().startsWith('can_edit_categories') ||
              permission.key.toLowerCase().startsWith('can_delete_categories') ||
              permission.key.toLowerCase().startsWith('can_add_products') ||
              permission.key.toLowerCase().startsWith('can_edit_products') ||
              permission.key.toLowerCase().startsWith('can_delete_products'))) ||
          (group.key === 'Orders' &&
            (permission.key.toLowerCase().startsWith('can_view_orders') ||
              permission.key.toLowerCase().startsWith('manage_prepared_orders') ||
              permission.key.toLowerCase().startsWith('manage_ready_orders') ||
              permission.key.toLowerCase().startsWith('manage_served_orders') ||
              permission.key.toLowerCase().startsWith('manage_completed_orders') ||
              permission.key.toLowerCase().startsWith('manage_cancelled_orders') ||
              permission.key.toLowerCase().startsWith('accept_onlineorders') ||
              permission.key.toLowerCase().startsWith('create_orders'))) ||
          (group.key === 'Roles Management' &&
            (permission.key.toLowerCase().startsWith('can_view_rolemanagement') ||
            permission.key.toLowerCase().startsWith('manage_users') ||
              permission.key.toLowerCase().startsWith('manage_roles') ||
              permission.key.toLowerCase().startsWith('manage_permissions'))) ||
          (group.key === 'Tables Management' &&
            (permission.key.toLowerCase().startsWith('can_view_tablemanagement') ||
            permission.key.toLowerCase().startsWith('manage_tables') ||
              permission.key.toLowerCase().startsWith('manage_floors') ||
              permission.key.toLowerCase().startsWith('assign_tables'))) ||
          (group.key === 'Settings' &&
            (permission.key.toLowerCase().startsWith('can_view_storesettings') ||
            permission.key.toLowerCase().startsWith('manage_store_settings') ||
              permission.key.toLowerCase().startsWith('manage_store_profile')))
        ) {
          group.subPermissions!.push(permission);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        ungroupedPermissions.push(permission);
      }
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
  }, [permissions]);

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
            subPermissions: filteredSubPermissions,
          };
        }
        return null;
      })
      .filter(Boolean) as GroupedPermission[];
  }, [groupedPermissions, searchQuery]);

  const indexOfLastGroup = currentPage * permissionsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - permissionsPerPage;
  const currentGroups = filteredPermissions.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(filteredPermissions.length / permissionsPerPage);

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prev => (prev === groupId ? null : groupId));
  };

  const handlePermissionClick = (permission: Permission) => {
    setSelectedPermission(permission);
  };

  const closeModal = () => {
    setSelectedPermission(null);
  };

  return (
    <div className="rounded-lg shadow-lg" style={{ backgroundColor: 'var(--surface-color)' }}>
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
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-1 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 self-end"
          style={{
            backgroundColor: 'var(--primary-color)',
            '--tw-ring-color': 'var(--focus-ring)',
          } as React.CSSProperties}
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Permission</span>
        </button>
      </div>

      {isLoading.fetch ? (
        <div className="space-y-3">
          {Array(4)
            .fill(0)
            .map((_, idx) => (
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
                    {expandedGroup === group.id ? (
                      <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                    <span>{group.key}</span>
                  </button>
                  {group.isMainPage && <span className="text-xs text-[--info-color]">(Main Page)</span>}
                </div>
              </div>
              {expandedGroup === group.id && group.subPermissions && group.subPermissions.length > 0 && (
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
                          <p className="text-xs text-[--text-secondary] mt-1">{permission.description}</p>
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
                            <svg
                              className="animate-spin w-5 h-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
            <div className="mt-6 flex justify-end"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionList;
