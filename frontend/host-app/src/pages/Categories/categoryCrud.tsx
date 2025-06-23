import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
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
  setTableErrorMessage?: (message: string | null) => void;
  onCancel: () => void;
  isProductFormActive: boolean;
  mode: 'add' | 'edit' | 'delete';
}

export default function CategoryCrud({
                                       token,
                                       logout,
                                       categories,
                                       setCategories,
                                       category,
                                       editingCategoryId,
                                       deleteCategoryId,
                                       setTableErrorMessage,
                                       onCancel,
                                       isProductFormActive,
                                       mode,
                                     }: CategoryCrudProps) {
  const [newCategoryName, setNewCategoryName] = useState(category?.name || '');
  const [newCategoryDesc, setNewCategoryDesc] = useState(category?.description || '');
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setNewCategoryName(category?.name || '');
    setNewCategoryDesc(category?.description || '');
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      toast.error('Please log in to perform this action');
      return;
    }

    if (mode === 'add' || mode === 'edit') {
      if (!newCategoryName.trim() || !newCategoryDesc.trim()) {
        toast.error('Name and description are required');
        return;
      }

      try {
        setFormErrorMessage(null);
        let updatedCategory;
        if (mode === 'add') {
          updatedCategory = await addCategory(token, logout, newCategoryName, newCategoryDesc);
          setCategories([...categories, updatedCategory]);
          toast.success('Category added successfully');
        } else if (mode === 'edit' && editingCategoryId) {
          updatedCategory = await updateCategory(token, logout, editingCategoryId, newCategoryName, newCategoryDesc);
          setCategories(categories.map((cat) => (cat._id === editingCategoryId ? updatedCategory : cat)));
          toast.success('Category updated successfully');
        }
        onCancel();
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to ${mode} category`;
        setFormErrorMessage(message);
        toast.error(message);
        if (setTableErrorMessage) setTableErrorMessage(message);
      }
    } else if (mode === 'delete' && deleteCategoryId) {
      try {
        setFormErrorMessage(null);
        await deleteCategory(token, logout, deleteCategoryId);
        setCategories(categories.filter((cat) => cat._id !== deleteCategoryId));
        toast.success('Category deleted successfully');
        onCancel();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete category';
        setFormErrorMessage(message);
        toast.error(message);
        if (setTableErrorMessage) setTableErrorMessage(message);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {mode === 'add' ? 'Add New Category' : mode === 'edit' ? 'Edit Category' : 'Confirm Deletion'}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      {(mode === 'add' || mode === 'edit') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              placeholder="Enter category description"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              required
            />
          </div>
          {formErrorMessage && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center">{formErrorMessage}</div>
          )}
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              {mode === 'edit' ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      )}
      {mode === 'delete' && deleteCategoryId && (
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
      )}
    </div>
  );
}
