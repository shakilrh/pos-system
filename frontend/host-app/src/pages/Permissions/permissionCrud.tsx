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
          <p key={index} className="text-xs flex items-start" style={{ color: 'var(--error-color)' }}>
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
    <div
      className="rounded-lg shadow-md border mt-6"
      style={{
        backgroundColor: 'var(--surface-color)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div
        className="p-6 border-b"
        style={{
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyIcon className="w-6 h-6" style={{ color: 'var(--primary-color)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Permission Management</h2>
          </div>
          {!showCreateForm && !editPermission && (
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--surface-color)',
              }}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Permission</span>
            </button>
          )}
        </div>
      </div>
      {(showCreateForm || editPermission) && (
        <div
          ref={formRef}
          className="rounded-lg p-6 mb-6 shadow-sm"
          style={{
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text-color)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
              {editPermission ? 'Edit Permission' : 'Create New Permission'}
            </h3>
            <button
              onClick={resetForm}
              style={{
                color: 'var(--text-secondary)',
              }}
              className="hover:opacity-80"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div
            className="mb-4 p-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--info-color-light)', // Assuming a light info color
              borderColor: 'var(--info-color)',
            }}
          >
            <p className="text-xs" style={{ color: 'var(--text-color)' }}>
              Use format: <code className="px-1 rounded" style={{ backgroundColor: 'var(--surface-secondary)' }}>resource_action</code>
              (e.g., orders_can_view, users_can_edit)
            </p>
          </div>
          <form onSubmit={editPermission ? handleUpdatePermission : handleCreatePermission} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Permission Type
                </label>
                <select
                  value={formData.isSubPermission ? 'sub' : 'parent'}
                  onChange={(e) => handleInputChange('isSubPermission', e.target.value === 'sub')}
                  onFocus={() => handleFocus('isSubPermission')}
                  onBlur={() => handleBlur('isSubPermission')}
                  className={`w-full p-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--surface-color)',
                    color: 'var(--text-color)',
                  }}
                >
                  <option value="parent">Main Permission</option>
                  <option value="sub">Sub Permission</option>
                </select>
              </div>
              {formData.isSubPermission && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Parent Permission
                  </label>
                  <select
                    value={formData.parentPermissionId}
                    onChange={(e) => handleInputChange('parentPermissionId', e.target.value)}
                    onFocus={() => handleFocus('parentPermissionId')}
                    onBlur={() => handleBlur('parentPermissionId')}
                    className={`w-full p-2.5 text-sm rounded-lg border ${
                      formErrors.parentPermissionId && formErrors.parentPermissionId.length > 0
                        ? 'ring-1'
                        : ''
                    } focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                    style={{
                      borderColor: formErrors.parentPermissionId && formErrors.parentPermissionId.length > 0
                        ? 'var(--error-color)'
                        : 'var(--border-color)',
                      backgroundColor: formErrors.parentPermissionId && formErrors.parentPermissionId.length > 0
                        ? 'var(--error-background)' // Assuming an error background color
                        : 'var(--surface-color)',
                      color: 'var(--text-color)',
                    }}
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
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      ? 'ring-1'
                      : ''
                  } focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  style={{
                    borderColor: formErrors.key && formErrors.key.length > 0
                      ? 'var(--error-color)'
                      : 'var(--border-color)',
                    backgroundColor: formErrors.key && formErrors.key.length > 0
                      ? 'var(--error-background)' // Assuming an error background color
                      : 'var(--surface-color)',
                    color: 'var(--text-color)',
                  }}
                  placeholder="e.g., orders_can_view"
                  maxLength={100}
                  required
                />
                {renderFieldErrors('key')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formData.key.length}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                      ? 'ring-1'
                      : ''
                  } focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                  style={{
                    borderColor: formErrors.description && formErrors.description.length > 0
                      ? 'var(--error-color)'
                      : 'var(--border-color)',
                    backgroundColor: formErrors.description && formErrors.description.length > 0
                      ? 'var(--error-background)' // Assuming an error background color
                      : 'var(--surface-color)',
                    color: 'var(--text-color)',
                  }}
                  placeholder="Describe permission (optional)"
                  maxLength={255}
                />
                {renderFieldErrors('description')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formData.description.length}/255
                </p>
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading.create || isLoading.update || !isFormValid()}
                className={`flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200`}
                style={{
                  backgroundColor: isLoading.create || isLoading.update || !isFormValid()
                    ? 'var(--primary-600)' // A slightly darker primary for disabled
                    : 'var(--primary-color)',
                  cursor: isLoading.create || isLoading.update || !isFormValid() ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading.create || isLoading.update ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" style={{ color: 'var(--surface-color)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                className="flex-1 border px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--surface-color)',
                  color: 'var(--text-color)',
                }}
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