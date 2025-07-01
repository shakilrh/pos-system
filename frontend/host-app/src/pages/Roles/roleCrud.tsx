import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { createRole, updateRole } from '../../services/RoleService';
import { RoleCrudProps, FormData, FormErrors } from './roleTypes';

const RoleCrud: React.FC<RoleCrudProps> = ({
                                             token,
                                             logout,
                                             roles,
                                             setRoles,
                                             editRole,
                                             setEditRole,
                                             showCreateForm,
                                             setShowCreateForm,
                                             setMessage,
                                             setIsSuccess,
                                             isLoading,
                                             setIsLoading,
                                           }) => {
  const [formData, setFormData] = useState<FormData>({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  React.useEffect(() => {
    if (editRole) {
      setFormData({
        name: editRole.name,
        description: editRole.description || '',
      });
      setFormErrors({});
      setShowCreateForm(false);
    } else {
      setFormData({ name: '', description: '' });
      setFormErrors({});
    }
  }, [editRole]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Role name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Role name must not exceed 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name.trim())) {
      errors.name = 'Only letters, numbers, spaces, hyphens, underscores allowed';
    } else {
      const trimmedName = formData.name.trim().toLowerCase();
      const isDuplicate = roles.some(
        (role) =>
          role.name.toLowerCase() === trimmedName &&
          (!editRole || role._id !== editRole._id)
      );
      if (isDuplicate) {
        errors.name = 'Role name already exists';
      }
    }

    if (formData.description.trim()) {
      if (formData.description.trim().length < 5) {
        errors.description = 'Description must be at least 5 characters';
      } else if (formData.description.trim().length > 200) {
        errors.description = 'Description must not exceed 200 characters';
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
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setEditRole(null);
    setShowCreateForm(false);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const newRole = await createRole(
        token!,
        logout,
        formData.name.trim(),
        formData.description.trim() || undefined
      );
      setRoles((prev) => [...prev, { ...newRole, permissions: newRole.permissions || [] }]);
      resetForm();
      setMessage('Role created successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create role');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole || !validateForm()) return;

    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const updatedRole = await updateRole(
        token!,
        logout,
        editRole._id,
        formData.name.trim(),
        formData.description.trim() || undefined
      );
      setRoles((prev) =>
        prev.map((role) =>
          role._id === editRole._id ? { ...updatedRole, permissions: updatedRole.permissions || [] } : role
        )
      );
      resetForm();
      setMessage('Role updated successfully!');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update role');
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
            <UserGroupIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Role Management</h2>
          </div>
          {!showCreateForm && !editRole && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Role</span>
            </button>
          )}
        </div>
      </div>

      {(showCreateForm || editRole) && (
        <div className="p-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editRole ? handleUpdateRole : handleCreateRole} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full p-2 text-sm rounded-md border ${
                    formErrors.name
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="e.g., Manager, Admin"
                  maxLength={50}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.name.length}/50
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
                  placeholder="Role responsibilities (optional)"
                  maxLength={200}
                />
                {formErrors.description && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.description.length}/200
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
                      {editRole ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editRole ? 'Update Role' : 'Create Role'
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

export default RoleCrud;
