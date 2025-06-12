import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon, TrashIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { fetchCategories, addCategory, updateCategory, deleteCategory } from '../services/CategoryService';

interface Category {
  _id: string;
  name: string;
  description: string;
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

interface CategoriesProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onFormActive: (active: boolean) => void;
}

export default function Categories({ token, isAuthenticated, logout, categories, setCategories, onFormActive }: CategoriesProps) {
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [tableErrorMessage, setTableErrorMessage] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteCategoryName, setDeleteCategoryName] = useState('');
  const itemsPerPage = 9;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setTableErrorMessage(null);
        const categoryList = await fetchCategories(token, logout);
        setCategories(categoryList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch categories';
        setTableErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, token, logout, setCategories]);

  useEffect(() => {
    onFormActive(!!formMode);
  }, [formMode, onFormActive]);

  useEffect(() => {
    const totalCategoryPages = Math.ceil(categories.length / itemsPerPage);
    if (currentCategoryPage > totalCategoryPages && totalCategoryPages > 0) {
      setCurrentCategoryPage(totalCategoryPages);
    } else if (categories.length === 0) {
      setCurrentCategoryPage(1);
    }
  }, [categories, currentCategoryPage]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      toast.error('Please log in to add a category');
      return;
    }
    if (!newCategoryName.trim() || !newCategoryDesc.trim()) {
      toast.error('Name and description are required');
      return;
    }

    try {
      setFormErrorMessage(null);
      const newCategory = await addCategory(token, logout, newCategoryName, newCategoryDesc);
      setCategories([...categories, newCategory]);
      resetForm();
      toast.success('Category added successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add category';
      setFormErrorMessage(message);
      toast.error(message);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category._id);
    setEditCategoryName(category.name);
    setEditCategoryDesc(category.description);
    setFormMode('edit');
  };

  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token || !editingCategoryId) {
      toast.error('Please log in to update a category');
      return;
    }
    if (!editCategoryName.trim() || !editCategoryDesc.trim()) {
      toast.error('Name and description are required');
      return;
    }

    try {
      setFormErrorMessage(null);
      const updatedCategory = await updateCategory(token, logout, editingCategoryId, editCategoryName, editCategoryDesc);
      setCategories(categories.map((cat) => (cat._id === editingCategoryId ? updatedCategory : cat)));
      resetForm();
      toast.success('Category updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      setFormErrorMessage(message);
      toast.error(message);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteCategoryId(id);
    setDeleteCategoryName(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!isAuthenticated || !token || !deleteCategoryId) {
      toast.error('Please log in to delete');
      return;
    }

    try {
      setTableErrorMessage(null);
      await deleteCategory(token, logout, deleteCategoryId);
      setCategories(categories.filter((cat) => cat._id !== deleteCategoryId));
      toast.success('Category deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setTableErrorMessage(message);
      toast.error(message);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteCategoryId(null);
      setDeleteCategoryName('');
    }
  };

  const resetForm = () => {
    setFormMode(null);
    setNewCategoryName('');
    setNewCategoryDesc('');
    setEditingCategoryId(null);
    setEditCategoryName('');
    setEditCategoryDesc('');
    setFormErrorMessage(null);
    setTableErrorMessage(null);
  };

  const indexOfLastCategory = currentCategoryPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = Array.isArray(categories)
    ? categories.slice(indexOfFirstCategory, indexOfLastCategory)
    : [];

  const totalCategoryPages = Array.isArray(categories)
    ? Math.ceil(categories.length / itemsPerPage)
    : 1;


  if (loading) {
    return (
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full relative">
      <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ display: formMode ? 'block' : 'none' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formMode === 'add' ? 'Add New Category' : 'Edit Category'}
          </h3>
          <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={formMode === 'add' ? handleAddCategory : handleSaveEditCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name</label>
            <input
              type="text"
              value={formMode === 'edit' ? editCategoryName : newCategoryName}
              onChange={(e) => (formMode === 'edit' ? setEditCategoryName(e.target.value) : setNewCategoryName(e.target.value))}
              placeholder="Enter category name"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={formMode === 'edit' ? editCategoryDesc : newCategoryDesc}
              onChange={(e) => (formMode === 'edit' ? setEditCategoryDesc(e.target.value) : setNewCategoryDesc(e.target.value))}
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
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              {formMode === 'edit' ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
      <div className="relative z-0" style={{ opacity: formMode ? 0.5 : 1, pointerEvents: formMode ? 'none' : 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 p-2 rounded-lg mr-2">
              Categories
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{categories.length} total</span>
          </h2>
          <button
            onClick={() => setFormMode('add')}
            className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusCircleIcon className="w-4 h-4 mr-1" />
            <span className="text-sm">Add</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCategories.map((category, idx) => (
                <tr
                  key={category._id}
                  className={`border-b border-gray-200 dark:border-gray-700 ${
                    idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-white dark:bg-gray-800'
                  } hover:bg-gray-100 dark:hover:bg-gray-600`}
                >
                  <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-semibold">{category.name}</td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id, category.name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tableErrorMessage && (
          <div className="mt-4 text-red-500 dark:text-red-400 text-center text-sm">{tableErrorMessage}</div>
        )}
        {totalCategoryPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-2">
            <button
              onClick={() => setCurrentCategoryPage(Math.max(currentCategoryPage - 1, 1))}
              disabled={currentCategoryPage === 1}
              className={`flex items-center px-3 py-1 rounded-lg ${
                currentCategoryPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Prev
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Page {currentCategoryPage} of {totalCategoryPages}
            </span>
            <button
              onClick={() => setCurrentCategoryPage(Math.min(currentCategoryPage + 1, totalCategoryPages))}
              disabled={currentCategoryPage === totalCategoryPages}
              className={`flex items-center px-3 py-1 rounded-lg ${
                currentCategoryPage === totalCategoryPages ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700'
              }`}
            >
              Next
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
      {isDeleteModalOpen && deleteCategoryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteCategoryId(null);
                  setDeleteCategoryName('');
                  setTableErrorMessage(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete the category "{deleteCategoryName}"? Products in this category will not be deleted.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteCategoryId(null);
                    setDeleteCategoryName('');
                    setTableErrorMessage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
