import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { fetchCategories } from '../../services/categoryService';
import { Category } from './categoryTypes';
import FlashMessage from '../FlashMessage';
import CategoryCrud from './categoryCrud';
import CategoryList from './categoryList';

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
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const isFormActive = activeSection !== 'list';

  return (
    <div
      className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full relative"
      style={{ opacity: isProductFormActive ? 0.5 : 1 }}
    >
      <Toaster position="top-right" />

      {/* Reserved space for flash messages - always present */}
      <div className="h-10 mb-4">
        {flashMessage && (
          <FlashMessage
            message={flashMessage.message}
            type={flashMessage.type}
            onClose={() => setFlashMessage(null)}
          />
        )}
      </div>

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

      {isFormActive && activeSection === 'add' && (
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

      {isFormActive && activeSection === 'edit' && selectedCategory && editingCategoryId && (
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

      {isDeleteModalOpen && deleteCategoryId && (
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
      )}
    </div>
  );
}
