import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { fetchCategories } from '../../services/categoryService';
import { Category } from './categoryTypes';
import FlashMessage from '../FlashMessage';
import CategoryCrud from './categoryCrud';
import CategoryList from './categoryList';
import { TagIcon } from '@heroicons/react/24/outline';

interface CategoriesProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onFormActive: (active: boolean) => void;
  isProductFormActive: boolean;
}

export default function Categories({
                                     token,
                                     isAuthenticated,
                                     logout,
                                     categories,
                                     setCategories,
                                     onFormActive,
                                     isProductFormActive
                                   }: CategoriesProps) {
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'add' | 'edit' | 'delete'>('list');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setFlashMessage(null);
      try {
        const categoryList = await fetchCategories(token, logout);
        setCategories(categoryList);
      } catch (err) {
        setFlashMessage({
          message: err instanceof Error ? err.message : 'Failed to fetch categories',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, token, logout, setCategories]);

  useEffect(() => {
    const isFormActive = activeSection !== 'list';
    onFormActive(isFormActive);
  }, [activeSection, onFormActive]);

  const handleAddCategory = () => {
    setActiveSection('add');
    setSelectedCategory(null);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setEditingCategoryId(category._id);
    setActiveSection('edit');
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find((cat) => cat._id === categoryId);
    if (category) {
      setSelectedCategory(category);
      setDeleteCategoryId(categoryId);
      setIsDeleteModalOpen(true);
    }
  };

  const resetForm = () => {
    setActiveSection('list');
    setSelectedCategory(null);
    setEditingCategoryId(null);
    setIsDeleteModalOpen(false);
    setDeleteCategoryId(null);
  };

  if (loading) {
    return (
      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded" style={{ backgroundColor: 'var(--background-secondary)' }}></div>
          {Array(4)
            .fill(0)
            .map((_, idx) => (
              <div key={idx} className="h-40 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}></div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)', opacity: isProductFormActive ? 0.5 : 1, pointerEvents: isProductFormActive ? 'none' : 'auto' }}>
      <Toaster position="top-right" />
      {flashMessage && (
        <FlashMessage
          message={flashMessage.message}
          type={flashMessage.type}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {/* Header - Always visible
      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center mb-4">
          <button className="mr-2" style={{ color: 'var(--text-secondary)' }}>
            <TagIcon className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Category Management</h3>
        </div>
      </div>*/}

      {/* Product List - Visible for list, details, and delete states */}
      {activeSection === 'list' && (
        <CategoryList
          token={token}
          isAuthenticated={isAuthenticated}
          logout={logout}
          categories={categories}
          setCategories={setCategories}
          isProductFormActive={isProductFormActive}
          onAdd={handleAddCategory}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          flashMessage={flashMessage}
          setFlashMessage={setFlashMessage}
        />
      )}

      {/* Add Form - Replaces list */}
      {activeSection === 'add' && (
        <CategoryCrud
          token={token}
          logout={logout}
          categories={categories}
          setCategories={setCategories}
          onCancel={resetForm}
          isProductFormActive={isProductFormActive}
          mode="add"
          setFlashMessageInParent={setFlashMessage}
        />
      )}

      {/* Edit Form - Replaces list */}
      {activeSection === 'edit' && selectedCategory && editingCategoryId && (
        <CategoryCrud
          token={token}
          logout={logout}
          categories={categories}
          setCategories={setCategories}
          category={selectedCategory}
          editingCategoryId={editingCategoryId}
          onCancel={resetForm}
          isProductFormActive={isProductFormActive}
          mode="edit"
          setFlashMessageInParent={setFlashMessage}
        />
      )}

      {/* Delete Modal - Overlays on list */}
      {isDeleteModalOpen && deleteCategoryId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md" style={{ backgroundColor: 'var(--background-color)' }}>
            <CategoryCrud
              token={token}
              logout={logout}
              categories={categories}
              setCategories={setCategories}
              category={selectedCategory}
              deleteCategoryId={deleteCategoryId}
              onCancel={resetForm}
              isProductFormActive={isProductFormActive}
              mode="delete"
              setFlashMessageInParent={setFlashMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
