import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, KeyIcon } from '@heroicons/react/24/outline';
import { createPermission, updatePermission } from '../../services/PermissionService';
import { PermissionCrudProps, FormData, FormErrors } from './permissionsTypes';

const PermissionCrud: React.FC<PermissionCrudProps> = ({
                                                         token,
                                                         logout,
                                                         permissions,
                                                         setPermissions,
                                                         editPermission,
                                                         setEditPermission,
                                                         showCreateForm,
                                                         setShowCreateForm,
                                                         setMessage,
                                                         setIsSuccess,
                                                         isLoading,
                                                         setIsLoading,
                                                       }) => {
  const [formData, setFormData] = useState<FormData>({ key: '', description: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  React.useEffect(() => {
    if (editPermission) {
      setFormData({
        key: editPermission.key,
        description: editPermission.description || '',
      });
      setFormErrors({});
      setShowCreateForm(false);
    } else {
      setFormData({ key: '', description: '' });
      setFormErrors({});
    }
  }, [editPermission]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.key.trim()) {
      errors.key = 'Permissions key is required';
    } else if (formData.key.trim().length < 3) {
      errors.key = 'Permissions key must be at least 3 characters';
    } else if (formData.key.trim().length > 100) {
      errors.key = 'Permissions key must not exceed 100 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.key.trim())) {
      errors.key = 'Only letters, numbers, and underscores allowed';
    } else if (!/^[a-zA-Z]/.test(formData.key.trim())) {
      errors.key = 'Permissions key must start with a letter';
    } else {
      const trimmedKey = formData.key.trim().toLowerCase();
      const isDuplicate = permissions.some(
        (permission) =>
          permission.key.toLowerCase() === trimmedKey &&
          (!editPermission || permission._id !== editPermission._id)
      );
      if (isDuplicate) {
        errors.key = 'Permissions key already exists';
      }
    }

    if (formData.description.trim()) {
      if (formData.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters';
      } else if (formData.description.trim().length > 255) {
        errors.description = 'Description must not exceed 255 characters';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({ key: '', description: '' });
    setFormErrors({});
    setEditPermission(null);
    setShowCreateForm(false);
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const newPermission = await createPermission(
        token!,
        logout,
        formData.key.trim(),
        formData.description.trim() || undefined
      );
      setPermissions((prev) => [...prev, newPermission]);
      resetForm();
      setMessage('Permissions created successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create permission');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermission || !validateForm()) return;

    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const updatedPermission = await updatePermission(
        token!,
        logout,
        editPermission._id,
        formData.key.trim(),
        formData.description.trim() || undefined
      );
      setPermissions((prev) =>
        prev.map((permission) =>
          permission._id === editPermission._id ? updatedPermission : permission
        )
      );
      resetForm();
      setMessage('Permissions updated successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update permission');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Permission Management</h2>
          </div>
          {!showCreateForm && !editPermission && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Permission</span>
            </button>
          )}
        </div>
      </div>

      {(showCreateForm || editPermission) && (
        <div className="p-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editPermission ? 'Edit Permissions' : 'Create New Permissions'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Use format: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">resource_action</code>
                (e.g., orders_can_view, users_can_edit)
              </p>
            </div>

            <form onSubmit={editPermission ? handleUpdatePermission : handleCreatePermission} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permission Key *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  className={`w-full p-2 text-sm rounded-md border ${
                    formErrors.key
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="e.g., orders_can_view"
                  maxLength={100}
                />
                {formErrors.key && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.key}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.key.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full p-2 text-sm rounded-md border resize-none ${
                    formErrors.description
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Describe permission (optional)"
                  maxLength={255}
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.description.length}/255
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading.create || isLoading.update}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {isLoading.create || isLoading.update ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                      {editPermission ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editPermission ? 'Update Permissions' : 'Create Permissions'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionCrud;
