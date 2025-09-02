import React, { useState, useEffect } from 'react';
import {XMarkIcon, TagIcon, UserIcon} from '@heroicons/react/24/outline';
import { addCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { Category } from './categoryTypes';
import FlashMessage from '../FlashMessage';

interface CategoryCrudProps {
  token: string | null;
  logout: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  category?: Category | null;
  editingCategoryId?: string | null;
  deleteCategoryId?: string | null;
  onCancel: () => void;
  isProductFormActive: boolean;
  mode: 'add' | 'edit' | 'delete';
  setFlashMessageInParent: (message: { message: string; type: 'success' | 'error' }) => void;
}

export default function CategoryCrud({
                                       token,
                                       logout,
                                       categories,
                                       setCategories,
                                       category,
                                       editingCategoryId,
                                       deleteCategoryId,
                                       onCancel,
                                       isProductFormActive,
                                       mode,
                                       setFlashMessageInParent,
                                     }: CategoryCrudProps) {
  const [newCategoryName, setNewCategoryName] = useState(category?.name || '');
  const [newCategoryDesc, setNewCategoryDesc] = useState(category?.description || '');
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Add loading state similar to roleCrud and productCrud
  const [isLoading, setIsLoading] = useState({
    create: false,
    update: false,
    delete: false
  });

  const [errors, setErrors] = useState<{
    name?: string[];
    description?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNewCategoryName(category?.name || '');
    setNewCategoryDesc(category?.description || '');
    setErrors({});
    setTouchedFields(new Set());
  }, [category]);

  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Category name is required');
    } else {
      if (name.length < 2) errors.push('Category name must be at least 2 characters long');
      if (name.length > 100) errors.push('Category name must be less than 100 characters');
      if (!/^[A-Za-z0-9\s&'-.,()]+$/.test(name)) {
        errors.push('Category name can only contain letters, numbers, spaces, and common punctuation');
      }
      if (/^\s|\s$/.test(name)) errors.push('Category name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Category name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateDescription = (description: string): string[] => {
    const errors: string[] = [];
    if (description && description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'name': return validateName(newCategoryName);
      case 'description': return validateDescription(newCategoryDesc);
      default: return [];
    }
  };

  const isFormValid = (): boolean => {
    return validateName(newCategoryName).length === 0;
  };

  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName === 'name') setNewCategoryName(value);
    if (fieldName === 'description') setNewCategoryDesc(value);

    if (touchedFields.has(fieldName)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName)
    }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0) return null;
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (mode === 'add' || mode === 'edit') {
      const allFields = ['name', 'description'];
      setTouchedFields(new Set(allFields));
      const allErrors: any = {};
      allFields.forEach(field => {
        allErrors[field] = getFieldErrors(field);
      });
      setErrors(allErrors);

      if (validateName(newCategoryName).length > 0) {
        setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
        setFlashMessageInParent({ message: 'Please fix all errors before submitting', type: 'error' });
        return;
      }
    }

    if (!token) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: 'Please log in to perform this action', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent(errorMessage);
      return;
    }

    // Set loading state based on mode
    if (mode === 'add') {
      setIsLoading(prev => ({ ...prev, create: true }));
    } else if (mode === 'edit') {
      setIsLoading(prev => ({ ...prev, update: true }));
    } else if (mode === 'delete') {
      setIsLoading(prev => ({ ...prev, delete: true }));
    }

    try {
      let updatedCategory: Category;
      if (mode === 'add') {
        updatedCategory = await addCategory(token, logout, newCategoryName, newCategoryDesc || undefined);
        setCategories([...categories, updatedCategory]);
        const successMessage: { message: string; type: 'success' | 'error' } = { message: `Category "${newCategoryName}" added successfully!`, type: 'success' };
        setFlashMessageInParent(successMessage);
      } else if (mode === 'edit' && editingCategoryId) {
        updatedCategory = await updateCategory(token, logout, editingCategoryId, newCategoryName, newCategoryDesc || undefined);
        setCategories(categories.map((cat) => (cat._id === editingCategoryId ? updatedCategory : cat)));
        const successMessage: { message: string; type: 'success' | 'error' } = { message: `Category "${newCategoryName}" updated successfully!`, type: 'success' };
        setFlashMessageInParent(successMessage);
      } else if (mode === 'delete' && deleteCategoryId) {
        await deleteCategory(token, logout, deleteCategoryId);
        setCategories(categories.filter((cat) => cat._id !== deleteCategoryId));
        const successMessage: { message: string; type: 'success' | 'error' } = { message: `Category "${category?.name}" deleted successfully!`, type: 'success' };
        setFlashMessageInParent(successMessage);
      }
      onCancel();
    } catch (err) {
      let message = err instanceof Error ? err.message : `Failed to ${mode} category`;
      if (mode === 'delete' && err instanceof Error && err.message.includes('products associated')) {
        message = `Cannot delete category "${category?.name}" because it has associated products.`;
      }
      const errorMessage: { message: string; type: 'success' | 'error' } = { message, type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent(errorMessage);
    } finally {
      // Reset loading state based on mode
      if (mode === 'add') {
        setIsLoading(prev => ({ ...prev, create: false }));
      } else if (mode === 'edit') {
        setIsLoading(prev => ({ ...prev, update: false }));
      } else if (mode === 'delete') {
        setIsLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  if (mode === 'add' || mode === 'edit') {
    return (
        <div className="">
          <div className="rounded-lg justify-between"
               style={{backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border-color)'}}>
            <div className="p-4 border-b flex justify-between" style={{borderColor: 'var(--border-color)'}}>
              <div className="flex items-center space-x-2">
                <TagIcon className="w-5 h-5" style={{color: 'var(--accent-color)'}}/>
                <h3 className="text-lg font-semibold" style={{color: 'var(--text-color)'}}>
                  {mode === 'edit' ? 'Edit Category' : 'Create New Category'}
                </h3>
              </div>
              <button onClick={onCancel} className="hover:text-[var(--text-secondary)]"
                      style={{color: 'var(--text-secondary)'}}>
                <XMarkIcon className="w-6 h-6"/>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="sm:col-span-2">
                  <label htmlFor="categoryName" className="block text-sm font-medium mb-1"
                         style={{color: 'var(--text-secondary)'}}>Category Name *</label>
                  <input
                      id="categoryName"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      placeholder="Enter category name"
                      className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.name && errors.name.length > 0 ? 'ring-1' : ''}`}
                      style={{
                        borderColor: errors.name && errors.name.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-color)',
                        outlineColor: 'var(--focus-ring)',
                      }}
                      maxLength={100}
                      required
                  />
                  {renderFieldErrors('name')}
                  <p className="mt-1 text-xs" style={{color: 'var(--text-tertiary)'}}>{newCategoryName.length}/100</p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="categoryDescription" className="block text-sm font-medium mb-1"
                         style={{color: 'var(--text-secondary)'}}>Description (Optional)</label>
                  <textarea
                      id="categoryDescription"
                      value={newCategoryDesc}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      onFocus={() => handleFocus('description')}
                      onBlur={() => handleBlur('description')}
                      placeholder="Category description (optional)"
                      className={`w-full p-2 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.description && errors.description.length > 0 ? 'ring-1' : ''}`}
                      style={{
                        borderColor: errors.description && errors.description.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                        backgroundColor: 'var(--background-color)',
                        color: 'var(--text-color)',
                        outlineColor: 'var(--focus-ring)',
                      }}
                      rows={3}
                      maxLength={500}
                  />
                  {renderFieldErrors('description')}
                  <p className="mt-1 text-xs" style={{color: 'var(--text-tertiary)'}}>{newCategoryDesc.length}/500</p>
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isProductFormActive || isLoading.create || isLoading.update ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                    style={{ backgroundColor: 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                    disabled={isProductFormActive || isLoading.create || isLoading.update}
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 ${isProductFormActive || isLoading.create || isLoading.update || !isFormValid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-color)]'}`}
                    style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                    disabled={isProductFormActive || isLoading.create || isLoading.update || !isFormValid()}
                >
                  {isLoading.create || isLoading.update ? (
                      <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                        {mode === 'edit' ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                      mode === 'edit' ? 'Update Category' : 'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
    );
  }

  if (mode === 'delete' && deleteCategoryId) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
               style={{backgroundColor: 'var(--surface-color)'}}>
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6" fill="currentColor" style={{ color: 'var(--error-color)' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Confirm Delete</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the category "{category?.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                  onClick={handleSubmit}
                  disabled={isLoading.delete}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--error-color)] text-[var(--text-on-primary)] hover:bg-opacity-90'}`}
                  style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
              >
                {isLoading.delete ? (
                    <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
                ) : (
                    'Delete'
                )}
              </button>
              <button
                  onClick={onCancel}
                  disabled={isLoading.delete}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                  style={{ backgroundColor: 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
    );
  }

  return null;
}