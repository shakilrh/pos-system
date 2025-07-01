import React from 'react';
import { PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Permission, PermissionListProps } from './permissionsTypes';

const PermissionList: React.FC<PermissionListProps> = ({
                                                         permissions,
                                                         setEditPermission,
                                                         handleDeletePermission,
                                                         isLoading,
                                                         setDeleteConfirm,
                                                       }) => {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Existing Permissions ({permissions.length})
        </h3>
      </div>

      {isLoading.fetch ? (
        <div className="space-y-2">
          {Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          ))}
        </div>
      ) : permissions.length === 0 ? (
        <div className="text-center py-8">
          <KeyIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No permissions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {permissions.map((permission) => (
            <div
              key={permission._id}
              className="bg-gray-50 dark:bg-gray-700 rounded-md p-3 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{permission.key}</h4>
                  {permission.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{permission.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditPermission(permission)}
                    className="p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Edit permission"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(permission._id)}
                    disabled={isLoading.delete === permission._id}
                    className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                    title="Delete permission"
                  >
                    {isLoading.delete === permission._id ? (
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

export default PermissionList;
