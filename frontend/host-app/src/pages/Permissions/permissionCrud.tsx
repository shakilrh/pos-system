import React, { useState, useEffect } from 'react';
import { XMarkIcon, KeyIcon } from '@heroicons/react/24/outline';
import { createPermission, updatePermission } from '../../services/PermissionService';
import { PermissionCrudProps, FormData, FormErrors } from './permissionsTypes';

const MAIN_PAGES = [
  {
    key: 'dashboard_access',
    name: 'Dashboard',
    description: 'Access to Dashboard page',
    subPermissions: [
      { key: 'can_view_dashboard', name: 'Can View Dashboard', description: 'View dashboard content' },
    ],
  },
  {
    key: 'menu_management_access',
    name: 'Menu Management',
    description: 'Access to Menu Management page',
    subPermissions: [
      { key: 'can_view_menu', name: 'Can View Menu', description: 'View Menu page' },
      { key: 'can_add_categories', name: 'Can Add Categories', description: 'Add categories' },
      { key: 'can_edit_categories', name: 'Can Edit Categories', description: 'Edit categories' },
      { key: 'can_delete_categories', name: 'Can Delete Categories', description: 'Delete categories' },
      { key: 'can_add_products', name: 'Can Add Products', description: 'Add products' },
      { key: 'can_edit_products', name: 'Can Edit Products', description: 'Edit products' },
      { key: 'can_delete_products', name: 'Can Delete Products', description: 'Delete products' },
    ],
  },
  {
    key: 'orders_access',
    name: 'Orders',
    description: 'Access to Orders page',
    subPermissions: [
      { key: 'can_view_orders', name: 'Can View Orders', description: 'View orders list' },
      { key: 'manage_prepared_orders', name: 'Manage Prepared Orders', description: 'Manage orders being prepared' },
      { key: 'manage_ready_orders', name: 'Manage Ready Orders', description: 'Manage ready orders' },
      { key: 'manage_served_orders', name: 'Manage Served Orders', description: 'Manage served orders' },
      { key: 'manage_completed_orders', name: 'Manage Completed Orders', description: 'Manage completed orders' },
      { key: 'manage_cancelled_orders', name: 'Manage Cancelled Orders', description: 'Manage Cancelled orders' },
      { key: 'accept_onlineorders', name: 'Accept Online Orders', description: 'Manage cOnline Pending orders' },
      { key: 'create_orders', name: 'Create Orders', description: 'Create new orders' },
    ],
  },
  {
    key: 'roles_management_access',
    name: 'Roles Management',
    description: 'Access to Roles Management page',
    subPermissions: [
      { key: 'can_view_rolemanagement', name: 'Can view RoleManagement', description: 'Manage user and roles accounts' },
      { key: 'can_add_users', name: 'Manage Users', description: 'Add user accounts' },
      { key: 'can_edit_users', name: 'Edit Users', description: 'Edit user accounts' },
      { key: 'can_delete_users', name: 'Delete Users', description: 'Delete user accounts' },
      { key: 'can_add_roles', name: 'Add Roles', description: 'Add roles' },
      { key: 'can_edit_roles', name: 'Edit Roles', description: 'Edit roles' },
      { key: 'can_delete_roles', name: 'Delete Roles', description: 'Delete roles' },
      { key: 'can_add_permissions', name: 'Add Permissions', description: 'Add permissions' },
      { key: 'can_edit_permissions', name: 'Edit Permissions', description: 'Edit permissions' },
      { key: 'can_delete_permissions', name: 'Delete Permissions', description: 'Delete permissions' },
      { key: 'assign_permissions', name: 'Manage Permissions', description: 'Manage permissions' },
    ],
  },
  {
    key: 'tables_management_access',
    name: 'Tables Management',
    description: 'Access to Tables Management page',
    subPermissions: [
      { key: 'can_view_tablemanagement', name: 'Can view TablesManagement', description: 'Manage tables and Floors' },
      { key: 'can_add_tables', name: 'Add Tables', description: 'Add tables' },
      { key: 'can_edit_tables', name: 'Edit Tables', description: 'EDit tables' },
      { key: 'can_delete_tables', name: 'Delete Tables', description: 'Delete tables' },
      { key: 'can_add_floors', name: 'Add Floors', description: 'Add floors' },
      { key: 'can_edit_floors', name: 'Edit Floors', description: 'Edit floors' },
      { key: 'can_delete_floors', name: 'Delete floors', description: 'Delete floors' },
      { key: 'assign_tables', name: 'Assign Tables', description: 'Assign tables to orders' },
    ],
  },
  {
    key: 'settings_access',
    name: 'Settings',
    description: 'Access to Settings page',
    subPermissions: [
      { key: 'can_view_storesettings', name: 'Can view  Store Settings', description: 'Manage store settings' },
      { key: 'manage_store_settings', name: 'Manage Store Settings', description: 'Manage store settings' },
      { key: 'manage_store_profile', name: 'Manage Store Profile', description: 'Manage store profile' },
    ],
  },
];

interface SubPermissionOption {
  key: string;
  name: string;
  description: string;
}

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
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [selectedMainPage, setSelectedMainPage] = useState<string>('');

  useEffect(() => {
    if (editPermission) {
      setFormData({
        key: editPermission.key,
        description: editPermission.description || '',
      });
      const mainPage = MAIN_PAGES.find(page =>
        page.subPermissions.some(sub => sub.key === editPermission.key)
      );
      setSelectedMainPage(mainPage ? mainPage.key : '');
      setFormErrors({});
      setShowCreateForm(false);
    } else {
      setFormData({ key: '', description: '' });
      setSelectedMainPage('');
      setFormErrors({});
      setTouchedFields(new Set());
    }
  }, [editPermission, setShowCreateForm]);

  const getSubPermissionOptions = () => {
    const mainPage = MAIN_PAGES.find(page => page.key === selectedMainPage);
    return mainPage ? mainPage.subPermissions : [];
  };

  const validateKey = (key: string): string[] => {
    const errors: string[] = [];
    if (!key) {
      errors.push('Permission key is required');
    } else {
      const isDuplicate = permissions.some(
        permission =>
          permission.key.toLowerCase() === key.toLowerCase() &&
          (!editPermission || permission._id !== editPermission._id)
      );
      if (isDuplicate) {
        errors.push('Permission key already exists');
      }
    }
    return errors;
  };

  const validateMainPage = (mainPage: string): string[] => {
    const errors: string[] = [];
    if (!mainPage) {
      errors.push('Main page selection is required');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'key':
        return validateKey(formData.key);
      case 'mainPage':
        return validateMainPage(selectedMainPage);
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    return ['key', 'mainPage'].every(field => {
      const errors = getFieldErrors(field);
      return errors.length === 0;
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'key') {
      const option = getSubPermissionOptions().find(opt => opt.key === value);
      setFormData(prev => ({
        ...prev,
        description: option?.description || prev.description,
      }));
    }
    if (touchedFields.has(field)) {
      setFormErrors(prev => ({
        ...prev,
        [field]: getFieldErrors(field),
      }));
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName),
    }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName),
      }));
    }
  };

  const resetForm = () => {
    setFormData({ key: '', description: '' });
    setSelectedMainPage('');
    setFormErrors({});
    setTouchedFields(new Set());
    setEditPermission(null);
    setShowCreateForm(false);
    setActiveSection('list');
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['key', 'mainPage'];
    setTouchedFields(new Set(allFields));

    const allErrors: FormErrors = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });

    setFormErrors(allErrors);

    const hasErrors = Object.values(allErrors).some(fieldErrors => fieldErrors.length > 0);

    if (hasErrors) {
      setMessage('Please fix all errors before submitting');
      setIsSuccess(false);
      return;
    }

    setIsLoading(prev => ({ ...prev, create: true }));
    try {
      const newPermission = await createPermission(
        token!,
        logout,
        formData.key,
        formData.description || undefined
      );
      setPermissions(prev => [...prev, newPermission]);
      resetForm();
      setMessage('Permission created successfully!');
      setIsSuccess(true);
      await loadPermissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create permission');
      setIsSuccess(false);
    } finally {
      setIsLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPermission) return;

    const allFields = ['key', 'mainPage'];
    setTouchedFields(new Set(allFields));

    const allErrors: FormErrors = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });

    setFormErrors(allErrors);

    const hasErrors = Object.values(allErrors).some(fieldErrors => fieldErrors.length > 0);

    if (hasErrors) {
      setMessage('Please fix all errors before submitting');
      setIsSuccess(false);
      return;
    }

    setIsLoading(prev => ({ ...prev, update: true }));
    try {
      const updatedPermission = await updatePermission(
        token!,
        logout,
        editPermission._id,
        formData.key,
        formData.description || undefined
      );
      setPermissions(prev =>
        prev.map(permission =>
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
      setIsLoading(prev => ({ ...prev, update: false }));
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = formErrors[fieldName as keyof FormErrors];
    if (!fieldErrors || fieldErrors.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {fieldErrors.map((error, index) => (
          <p key={index} className="text-xs flex items-start" style={{ color: '#ef4444' }}>
            <svg
              className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div
      className="rounded-lg p-3 mb-3 shadow-sm"
      style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}
    >
      <div
        className="flex items-center justify-between px-6 py-4 w-full"
        style={{
          backgroundColor: 'var(--background-color)',
          borderBottom: '1px solid var(--border-color)',
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem',
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <KeyIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
              {editPermission ? 'Edit Permission' : 'Create Permission'}
            </h3>
          </div>
        </div>
      </div>
      <div
        className="rounded-lg p-3"
        style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border-color)' }}
      >
        <form onSubmit={editPermission ? handleUpdatePermission : handleCreatePermission} className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Main Page *
              </label>
              <select
                value={selectedMainPage}
                onChange={e => {
                  setSelectedMainPage(e.target.value);
                  setFormData(prev => ({ ...prev, key: '', description: '' }));
                }}
                onFocus={() => handleFocus('mainPage')}
                onBlur={() => handleBlur('mainPage')}
                className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${
                  formErrors.mainPage && formErrors.mainPage.length > 0 ? 'ring-1 ring-red-500' : ''
                }`}
                style={{
                  borderColor: formErrors.mainPage && formErrors.mainPage.length > 0 ? '#ef4444' : '#d1d5db',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  outlineColor: 'var(--focus-ring)',
                }}
              >
                <option value="">Select main page</option>
                {MAIN_PAGES.map(page => (
                  <option key={page.key} value={page.key}>
                    {page.name}
                  </option>
                ))}
              </select>
              {renderFieldErrors('mainPage')}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Permission *
              </label>
              <select
                value={formData.key}
                onChange={e => handleInputChange('key', e.target.value)}
                onFocus={() => handleFocus('key')}
                onBlur={() => handleBlur('key')}
                className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${
                  formErrors.key && formErrors.key.length > 0 ? 'ring-1 ring-red-500' : ''
                }`}
                style={{
                  borderColor: formErrors.key && formErrors.key.length > 0 ? '#ef4444' : '#d1d5db',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  outlineColor: 'var(--focus-ring)',
                }}
                disabled={!selectedMainPage}
              >
                <option value="">Select permission</option>
                {getSubPermissionOptions().map(option => (
                  <option key={option.key} value={option.key}>
                    {option.name}
                  </option>
                ))}
              </select>
              {renderFieldErrors('key')}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                onFocus={() => handleFocus('description')}
                onBlur={() => handleBlur('description')}
                rows={3}
                className="w-full p-2 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 transition-colors duration-200"
                style={{
                  borderColor: '#d1d5db',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  outlineColor: 'var(--focus-ring)',
                }}
              />
            </div>
          </div>
          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={isLoading.create || isLoading.update || !isFormValid()}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${
                isLoading.create || isLoading.update || !isFormValid()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : ''
              }`}
              style={{
                backgroundColor:
                  isLoading.create || isLoading.update || !isFormValid()
                    ? undefined
                    : 'var(--primary-color)',
                color:
                  isLoading.create || isLoading.update || !isFormValid()
                    ? undefined
                    : 'var(--text-on-primary)',
                cursor:
                  isLoading.create || isLoading.update || !isFormValid() ? 'not-allowed' : 'pointer',
                '--tw-ring-color': 'var(--focus-ring)',
              }}
            >
              {isLoading.create || isLoading.update ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
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
                  {editPermission ? 'Updating...' : 'Creating...'}
                </span>
              ) : editPermission ? (
                'Update Permission'
              ) : (
                'Create Permission'
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${
                isLoading.create || isLoading.update ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                cursor: isLoading.create || isLoading.update ? 'not-allowed' : 'pointer',
                '--tw-ring-color': 'var(--focus-ring)',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionCrud;
