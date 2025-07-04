import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, KeyIcon } from '@heroicons/react/24/outline';
import { createPermission, updatePermission } from '../../services/PermissionService';
import { PermissionCrudProps, FormData, FormErrors } from './permissionsTypes';

// Main pages configuration
const MAIN_PAGES = [
  { key: 'dashboard_access', name: 'Dashboard', description: 'Access to Dashboard page' },
  { key: 'menu_access', name: 'Menu Management', description: 'Access to Menu Management page' },
  { key: 'orders_access', name: 'Orders', description: 'Access to Orders page' },
  { key: 'roles_management_access', name: 'Roles Management', description: 'Access to Roles Management page' },
  { key: 'settings_access', name: 'Settings', description: 'Access to Settings page' },
];

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
                                                         loadPermissions,
                                                         setActiveSection,
                                                       }) => {
  const [formData, setFormData] = useState<FormData>({
    key: '',
    description: '',
    isSubPermission: false,
    parentPermissionId: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const formRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editPermission && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (editPermission) {
      setFormData({
        key: editPermission.key,
        description: editPermission.description || '',
        isSubPermission: !!editPermission.parentId,
        parentPermissionId: editPermission.parentId || ''
      });
      setFormErrors({});
      setShowCreateForm(false);
    } else {
      setFormData({ key: '', description: '', isSubPermission: false, parentPermissionId: '' });
      setFormErrors({});
      setTouchedFields(new Set());
    }
  }, [editPermission, setShowCreateForm]);

  const validateKey = (key: string): string[] => {
    const errors: string[] = [];
    if (!key.trim()) {
      errors.push('Permission key is required');
    } else {
      if (key.trim().length < 3) errors.push('Permission key must be at least 3 characters');
      if (key.trim().length > 100) errors.push('Permission key must not exceed 100 characters');
      if (!/^[a-zA-Z0-9_]+$/.test(key.trim())) {
        errors.push('Only letters, numbers, and underscores allowed');
      }
      if (!/^[a-zA-Z]/.test(key.trim())) {
        errors.push('Permission key must start with a letter');
      }
      const trimmedKey = key.trim().toLowerCase();
      const isDuplicate = permissions.some(
        (permission) =>
          permission.key.toLowerCase() === trimmedKey &&
          (!editPermission || permission._id !== editPermission._id)
      );
      if (isDuplicate) {
        errors.push('Permission key already exists');
      }
    }
    return errors;
  };

  const validateDescription = (description: string): string[] => {
    const errors: string[] = [];
    if (description && description.trim()) {
      if (description.length < 10) errors.push('Description must be at least 10 characters long if provided');
      if (description.length > 255) errors.push('Description must not exceed 255 characters');
      if (/^\s|\s$/.test(description)) errors.push('Description cannot start or end with spaces');
      if (/\s{2,}/.test(description)) errors.push('Description cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateParentPermission = (isSubPermission: boolean, parentPermissionId: string): string[] => {
    const errors: string[] = [];
    if (isSubPermission && !parentPermissionId) {
      errors.push('Parent permission is required for sub-permissions');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'key':
        return validateKey(formData.key);
      case 'description':
        return validateDescription(formData.description);
      case 'parentPermissionId':
        return validateParentPermission(formData.isSubPermission, formData.parentPermissionId);
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    return ['key', 'parentPermissionId'].every(field => {
      const errors = getFieldErrors(field);
      return errors.length === 0;
    });
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touchedFields.has(field as string)) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: getFieldErrors(field as string)
      }));
    }
    if (field === 'isSubPermission' && !value) {
      setFormData((prev) => ({ ...prev, parentPermissionId: '' }));
      setFormErrors((prev) => ({ ...prev, parentPermissionId: [] }));
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName)
    }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  const resetForm = () => {
    setFormData({ key: '', description: '', isSubPermission: false, parentPermissionId: '' });
    setFormErrors({});
    setTouchedFields(new Set());
    setEditPermission(null);
    setShowCreateForm(false);
    setActiveSection('list');
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['key', 'description', 'parentPermissionId'];
    setTouchedFields(new Set(allFields));

    const allErrors: FormErrors = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });

    setFormErrors(allErrors);

    const hasErrors = Object.values(allErrors).some((fieldErrors) => fieldErrors.length > 0);

    if (hasErrors) {
      setMessage('Please fix all errors before submitting');
      setIsSuccess(false);
      return;
    }

    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const newPermission = await createPermission(
        token!,
        logout,
        formData.key.trim(),
        formData.description.trim() || undefined,
        formData.isSubPermission ? formData.parentPermissionId : undefined
      );
      setPermissions((prev) => [...prev, newPermission]);
      resetForm();
      setMessage('Permission created successfully!');
      setIsSuccess(true);
      await loadPermissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create permission');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermission) return;

    const allFields = ['key', 'description', 'parentPermissionId'];
    setTouchedFields(new Set(allFields));

    const allErrors: FormErrors = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });

    setFormErrors(allErrors);

    const hasErrors = Object.values(allErrors).some((fieldErrors) => fieldErrors.length > 0);

    if (hasErrors) {
      setMessage('Please fix all errors before submitting');
      setIsSuccess(false);
      return;
    }

    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const updatedPermission = await updatePermission(
        token!,
        logout,
        editPermission._id,
        formData.key.trim(),
        formData.description.trim() || undefined,
        formData.isSubPermission ? formData.parentPermissionId : undefined
      );
      setPermissions((prev) =>
        prev.map((permission) =>
          permission._id === editPermission._id ? updatedPermission : permission
        )
      );
      resetForm();
      setMessage('Permission updated successfully!');
      setIsSuccess(true);
      await loadPermissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update permission');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = formErrors[fieldName as keyof FormErrors];
    if (!fieldErrors || fieldErrors.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {fieldErrors.map((error, index) => (
          <p key={index} className="text-red-500 text-xs flex items-start">
            <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        ))}
      </div>
    );
  };

  // Filter main page permissions based on all MAIN_PAGES
  const mainPagePermissions = permissions.filter(p =>
    MAIN_PAGES.some(page => p.key.toLowerCase().includes(page.key))
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-6">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Permission Management</h2>
          </div>
          {!showCreateForm && !editPermission && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Permission</span>
            </button>
          )}
        </div>
      </div>
      {(showCreateForm || editPermission) && (
        <div ref={formRef} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editPermission ? 'Edit Permission' : 'Create New Permission'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              Use format: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">resource_action</code>
              (e.g., orders_can_view, users_can_edit)
            </p>
          </div>
          <form onSubmit={editPermission ? handleUpdatePermission : handleCreatePermission} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permission Type
                </label>
                <select
                  value={formData.isSubPermission ? 'sub' : 'parent'}
                  onChange={(e) => handleInputChange('isSubPermission', e.target.value === 'sub')}
                  onFocus={() => handleFocus('isSubPermission')}
                  onBlur={() => handleBlur('isSubPermission')}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <option value="parent">Main Permission</option>
                  <option value="sub">Sub Permission</option>
                </select>
              </div>
              {formData.isSubPermission && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Parent Permission
                  </label>
                  <select
                    value={formData.parentPermissionId}
                    onChange={(e) => handleInputChange('parentPermissionId', e.target.value)}
                    onFocus={() => handleFocus('parentPermissionId')}
                    onBlur={() => handleBlur('parentPermissionId')}
                    className={`w-full p-2.5 text-sm rounded-lg border ${
                      formErrors.parentPermissionId && formErrors.parentPermissionId.length > 0
                        ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                  >
                    <option value="">Select parent permission</option>
                    {mainPagePermissions.map((permission) => (
                      <option key={permission._id} value={permission._id}>
                        {permission.key}
                      </option>
                    ))}
                  </select>
                  {renderFieldErrors('parentPermissionId')}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permission Key *
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  onFocus={() => handleFocus('key')}
                  onBlur={() => handleBlur('key')}
                  className={`w-full p-2.5 text-sm rounded-lg border ${
                    formErrors.key && formErrors.key.length > 0
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                  placeholder="e.g., orders_can_view"
                  maxLength={100}
                  required
                />
                {renderFieldErrors('key')}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.key.length}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onFocus={() => handleFocus('description')}
                  onBlur={() => handleBlur('description')}
                  rows={3}
                  className={`w-full p-2.5 text-sm rounded-lg border resize-none ${
                    formErrors.description && formErrors.description.length > 0
                      ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                  placeholder="Describe permission (optional)"
                  maxLength={255}
                />
                {renderFieldErrors('description')}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {formData.description.length}/255
                </p>
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading.create || isLoading.update || !isFormValid()}
                className={`flex-1 ${
                  isLoading.create || isLoading.update || !isFormValid()
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
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
                  editPermission ? 'Update Permission' : 'Create Permission'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PermissionCrud;
