import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { addCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { Category } from './categoryTypes';

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
        setFlashMessageInParent({ message: 'Please fix all errors before submitting', type: 'error' });
        return;
      }
    }

    if (!token) {
      setFlashMessageInParent({ message: 'Please log in to perform this action', type: 'error' });
      return;
    }

    try {
      let updatedCategory;
      if (mode === 'add') {
        updatedCategory = await addCategory(token, logout, newCategoryName, newCategoryDesc || undefined);
        setCategories([...categories, updatedCategory]);
        setFlashMessageInParent({
          message: `Category "${newCategoryName}" added successfully!`,
          type: 'success'
        });
      } else if (mode === 'edit' && editingCategoryId) {
        updatedCategory = await updateCategory(token, logout, editingCategoryId, newCategoryName, newCategoryDesc || undefined);
        setCategories(categories.map((cat) => (cat._id === editingCategoryId ? updatedCategory : cat)));
        setFlashMessageInParent({
          message: `Category "${newCategoryName}" updated successfully!`,
          type: 'success'
        });
      } else if (mode === 'delete' && deleteCategoryId) {
        await deleteCategory(token, logout, deleteCategoryId);
        setCategories(categories.filter((cat) => cat._id !== deleteCategoryId));
        setFlashMessageInParent({
          message: `Category "${category?.name}" deleted successfully!`,
          type: 'success'
        });
      }
      onCancel();
    } catch (err) {
      let message = err instanceof Error ? err.message : `Failed to ${mode} category`;
      if (mode === 'delete' && err instanceof Error && err.message.includes('products associated')) {
        message = `Cannot delete category "${category?.name}" because it has associated products.`;
      }
      setFlashMessageInParent({ message, type: 'error' });
    }
  };

  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'add' ? 'Add New Category' : 'Edit Category'}
          </h3>
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category Name *
            </label>
            <input
              id="categoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onFocus={() => handleFocus('name')}
              onBlur={() => handleBlur('name')}
              placeholder="Enter category name"
              className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border ${
                errors.name && errors.name.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200`}
            />
            {renderFieldErrors('name')}
          </div>
          <div>
            <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              id="categoryDescription"
              value={newCategoryDesc}
              onChange={(e) => handleInputChange('description', e.target.value)}
              onFocus={() => handleFocus('description')}
              onBlur={() => handleBlur('description')}
              placeholder="Enter category description"
              className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border ${
                errors.description && errors.description.length > 0 ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all duration-200`}
              rows={3}
            />
            {renderFieldErrors('description')}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center ${
                !isFormValid() || isProductFormActive ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={!isFormValid() || isProductFormActive}
            >
              {mode === 'edit' ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'delete' && deleteCategoryId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
            <button onClick={onCancel} className="text-gray-600 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete the category "{category?.name}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
