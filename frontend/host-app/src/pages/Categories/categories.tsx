import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon, TrashIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { fetchCategories, addCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { Category } from './categoryTypes';
import FlashMessage from '../FlashMessage'; // Adjust the import path as necessary

interface CategoriesProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onFormActive: (active: boolean) => void;
  isProductFormActive: boolean;
}

export default function Categories({ token, isAuthenticated, logout, categories, setCategories, onFormActive, isProductFormActive }: CategoriesProps) {
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
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
        setFlashMessage(null);
        const categoryList = await fetchCategories(token, logout);
        setCategories(categoryList);
      } catch (err) {
        setFlashMessage({ message: err instanceof Error ? err.message : 'Failed to fetch categories', type: 'error' });
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

    try {
      const newCategory = await addCategory(token, logout, newCategoryName, newCategoryDesc);
      setCategories([...categories, newCategory]);
      resetForm();
      setFlashMessage({ message: 'Category added successfully', type: 'success' });
    } catch (err) {
      setFlashMessage({ message: err instanceof Error ? err.message : 'Failed to add category', type: 'error' });
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

    try {
      if (editingCategoryId) {
        const updatedCategory = await updateCategory(token, logout, editingCategoryId, editCategoryName, editCategoryDesc);
        setCategories(categories.map((cat) => (cat._id === editingCategoryId ? updatedCategory : cat)));
        resetForm();
        setFlashMessage({ message: 'Category updated successfully', type: 'success' });
      }
    } catch (err) {
      setFlashMessage({ message: err instanceof Error ? err.message : 'Failed to update category', type: 'error' });
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setDeleteCategoryId(id);
    setDeleteCategoryName(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (deleteCategoryId) {
        await deleteCategory(token, logout, deleteCategoryId);
        setCategories(categories.filter((cat) => cat._id !== deleteCategoryId));
        setFlashMessage({ message: 'Category deleted successfully', type: 'success' });
      }
    } catch (err) {
      setFlashMessage({ message: err instanceof Error ? err.message : 'Failed to delete category', type: 'error' });
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
    setFlashMessage(null);
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
      <div className="lg:col-span-1 product-crud-container rounded-xl shadow-lg p-4 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-lg"></div>
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="h-8 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 product-crud-container rounded-xl shadow-lg p-4 h-full relative" style={{ opacity: isProductFormActive ? 0.5 : 1 }}>
      {flashMessage && !formMode && (
        <FlashMessage
          message={flashMessage.message}
          type={flashMessage.type}
          onClose={() => setFlashMessage(null)}
        />
      )}
      <div className="absolute inset-0 z-10 product-crud-container p-4 rounded-xl shadow-lg overflow-y-auto" style={{ display: formMode ? 'block' : 'none' }}>
        {flashMessage && formMode && (
          <FlashMessage
            message={flashMessage.message}
            type={flashMessage.type}
            onClose={() => setFlashMessage(null)}
          />
        )}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-text">
            {formMode === 'add' ? 'Add New Category' : 'Edit Category'}
          </h3>
          <button onClick={resetForm} className="text-text-secondary hover:text-text">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={formMode === 'add' ? handleAddCategory : handleSaveEditCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium product-crud-label mb-1">Category Name</label>
            <input
              type="text"
              value={formMode === 'edit' ? editCategoryName : newCategoryName}
              onChange={(e) => (formMode === 'edit' ? setEditCategoryName(e.target.value) : setNewCategoryName(e.target.value))}
              placeholder="Enter category name"
              className={`product-crud-input w-full p-2 rounded-lg border border-transparent ${newCategoryName.length > 0 ? 'border-border' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium product-crud-label mb-1">Description</label>
            <textarea
              value={formMode === 'edit' ? editCategoryDesc : newCategoryDesc}
              onChange={(e) => (formMode === 'edit' ? setEditCategoryDesc(e.target.value) : setNewCategoryDesc(e.target.value))}
              placeholder="Enter category description"
              className={`product-crud-input w-full p-2 rounded-lg border border-transparent ${newCategoryDesc.length > 0 ? 'border-border' : ''}`}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="product-crud-cancel-button px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="product-crud-button hover:text-white px-4 py-2 rounded-lg flex items-center"
            >
              {formMode === 'edit' ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
      <div className="relative z-0" style={{ opacity: formMode ? 0.5 : 1, pointerEvents: formMode ? 'none' : 'auto' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-text flex items-center">
            <span className="font-bold text-[var(--text-color))] p-2 mr-2">
              Categories
            </span>
            <span className="text-sm text-text-secondary">{categories.length} total</span>
          </h2>
          <button
            onClick={() => {
              setFormMode('add');
              onFormActive(true);
            }}
            className="product-crud-button flex items-center px-3 py-1 rounded-lg text-sm transition-all duration-200"
            style={{
              background: "var(--primary-color)",
              color: "white",
            }}
            disabled={isProductFormActive}
            onMouseEnter={e => {
              if (!isProductFormActive) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-600)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-color)";
              }
            }}
            onMouseLeave={e => {
              if (!isProductFormActive) {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-color)";
                (e.currentTarget as HTMLButtonElement).style.color = "white";
              }
            }}
          >
            <PlusCircleIcon className="w-4 h-4 mr-1" />
            <span>Add</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface text-text-secondary uppercase text-xs">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCategories.map((category, idx) => (
                <tr
                  key={category._id}
                  className={`border-b border-border hover:bg-slate-200/50 ${idx % 2 === 0 ? 'bg-surface' : 'bg-background-secondary'
                    }`}
                >
                  <td className="py-3 px-4 text-text font-semibold">{category.name}</td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-500/10"
                      title="Edit"
                      disabled={isProductFormActive}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category._id, category.name)}
                      className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-500/10"
                      title="Delete"
                      disabled={isProductFormActive}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalCategoryPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-2">
            <button
              onClick={() => setCurrentCategoryPage(Math.max(currentCategoryPage - 1, 1))}
              disabled={currentCategoryPage === 1 || isProductFormActive}
              className={`flex items-center px-3 py-1 rounded-lg ${currentCategoryPage === 1 || isProductFormActive ? 'text-text-secondary cursor-not-allowed' : 'text-blue-500 hover:bg-surface'
                }`}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Prev
            </button>
            <span className="text-sm text-text-secondary">
              Page {currentCategoryPage} of {totalCategoryPages}
            </span>
            <button
              onClick={() => setCurrentCategoryPage(Math.min(currentCategoryPage + 1, totalCategoryPages))}
              disabled={currentCategoryPage === totalCategoryPages || isProductFormActive}
              className={`flex items-center px-3 py-1 rounded-lg ${currentCategoryPage === totalCategoryPages || isProductFormActive ? 'text-text-secondary cursor-not-allowed' : 'text-blue-500 hover:bg-surface'
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
          <div className="product-crud-container rounded-xl shadow-2xl w-full max-w-sm">
            {flashMessage && (
              <FlashMessage
                message={flashMessage.message}
                type={flashMessage.type}
                onClose={() => setFlashMessage(null)}
              />
            )}
            <div className="flex justify-between items-center border-b border-border p-4">
              <h3 className="text-lg font-semibold text-text">Confirm Deletion</h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteCategoryId(null);
                  setDeleteCategoryName('');
                  setFlashMessage(null);
                }}
                className="text-text-secondary hover:text-text"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-text-secondary mb-6">
                Are you sure you want to delete the category "{deleteCategoryName}"?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteCategoryId(null);
                    setDeleteCategoryName('');
                    setFlashMessage(null);
                  }}
                  className="product-crud-cancel-button px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="product-crud-delete-button hover:text-white px-4 py-2 rounded-lg flex items-center"
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