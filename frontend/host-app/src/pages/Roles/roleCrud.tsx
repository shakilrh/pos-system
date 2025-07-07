import React, { useState, useEffect } from 'react';
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
                                             loadRoles,
                                           }) => {
  const [formData, setFormData] = useState<FormData>({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const formRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editRole && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      setTouchedFields(new Set());
    }
  }, [editRole, setShowCreateForm]);

  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Role name is required');
    } else {
      if (name.length < 2) errors.push('Role name must be at least 2 characters long');
      if (name.length > 50) errors.push('Role name must be less than 50 characters');
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
        errors.push('Role name can only contain letters, numbers, spaces, hyphens, and underscores');
      }
      if (/^\s|\s$/.test(name)) errors.push('Role name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Role name cannot contain multiple consecutive spaces');
      const trimmedName = name.trim().toLowerCase();
      const isDuplicate = roles.some(
        (role) =>
          role.name.toLowerCase() === trimmedName &&
          (!editRole || role._id !== editRole._id)
      );
      if (isDuplicate) {
        errors.push('Role name already exists');
      }
    }
    return errors;
  };

  const validateDescription = (description: string): string[] => {
    const errors: string[] = [];
    if (description && description.trim()) {
      if (description.length < 5) errors.push('Description must be at least 5 characters long if provided');
      if (description.length > 200) errors.push('Description must not exceed 200 characters');
      if (/^\s|\s$/.test(description)) errors.push('Description cannot start or end with spaces');
      if (/\s{2,}/.test(description)) errors.push('Description cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'name':
        return validateName(formData.name);
      case 'description':
        return validateDescription(formData.description);
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    return ['name'].every(field => {
      const errors = getFieldErrors(field);
      return errors.length === 0;
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touchedFields.has(field)) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: getFieldErrors(field)
      }));
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
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setTouchedFields(new Set());
    setEditRole(null);
    setShowCreateForm(false);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['name', 'description'];
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
      await loadRoles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create role');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole) return;

    const allFields = ['name', 'description'];
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
      await loadRoles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update role');
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

  return (
    <div className="rounded-lg shadow-md border mt-6" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
      <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserGroupIcon className="w-6 h-6" style={{ color: 'var(--accent-color)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Role Management</h2>
          </div>
          {!showCreateForm && !editRole && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'var(--text-on-primary)',
                '--tw-ring-color': 'var(--focus-ring)'
              } as React.CSSProperties}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Role</span>
            </button>
          )}
        </div>
      </div>
      {(showCreateForm || editRole) && (
        <div ref={formRef} className="rounded-lg p-6 mb-6 shadow-sm" style={{ backgroundColor: 'var(--background-secondary)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
              {editRole ? 'Edit Role' : 'Create New Role'}
            </h3>
            <button
              onClick={resetForm}
              style={{ color: 'var(--text-tertiary)' }}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={editRole ? handleUpdateRole : handleCreateRole} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Role Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => handleFocus('name')}
                  onBlur={() => handleBlur('name')}
                  className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200`}
                  style={{
                    borderColor: formErrors.name && formErrors.name.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: formErrors.name && formErrors.name.length > 0 ? 'var(--error-background)' : 'var(--background-color)',
                    color: 'var(--text-color)',
                    '--tw-ring-color': formErrors.name && formErrors.name.length > 0 ? 'var(--error-color)' : 'var(--focus-ring)'
                  } as React.CSSProperties}
                  placeholder="e.g., Manager, Admin"
                  maxLength={50}
                  required
                />
                {renderFieldErrors('name')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formData.name.length}/50
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
                  className={`w-full p-2.5 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 transition-colors duration-200`}
                  style={{
                    borderColor: formErrors.description && formErrors.description.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: formErrors.description && formErrors.description.length > 0 ? 'var(--error-background)' : 'var(--background-color)',
                    color: 'var(--text-color)',
                    '--tw-ring-color': formErrors.description && formErrors.description.length > 0 ? 'var(--error-color)' : 'var(--focus-ring)'
                  } as React.CSSProperties}
                  placeholder="Role responsibilities (optional)"
                  maxLength={200}
                />
                {renderFieldErrors('description')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formData.description.length}/200
                </p>
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading.create || isLoading.update || !isFormValid()}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200`}
                style={{
                  backgroundColor: isLoading.create || isLoading.update || !isFormValid() ? 'var(--primary-disabled)' : 'var(--primary-color)',
                  color: 'var(--text-on-primary)',
                  cursor: isLoading.create || isLoading.update || !isFormValid() ? 'not-allowed' : 'pointer',
                  '--tw-ring-color': 'var(--focus-ring)'
                } as React.CSSProperties}
              >
                {isLoading.create || isLoading.update ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' }}>
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
                className="px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)',
                  '--tw-ring-color': 'var(--focus-ring)'
                } as React.CSSProperties}
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

export default RoleCrud;