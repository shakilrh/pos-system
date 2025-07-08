import { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import { Category } from './categoryTypes';
import FlashMessage from '../FlashMessage';

interface CategoryListProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  isProductFormActive: boolean;
  onAdd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  flashMessage: { message: string; type: 'success' | 'error' } | null;
  setFlashMessage: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
}

export default function CategoryList({
                                       token,
                                       isAuthenticated,
                                       logout,
                                       categories,
                                       setCategories,
                                       isProductFormActive,
                                       onAdd,
                                       onEdit,
                                       onDelete,
                                       flashMessage,
                                       setFlashMessage,
                                     }: CategoryListProps) {
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const totalCategoryPages = Math.ceil(categories.length / itemsPerPage);
    if (currentCategoryPage > totalCategoryPages && totalCategoryPages > 0) {
      setCurrentCategoryPage(totalCategoryPages);
    } else if (categories.length === 0) {
      setCurrentCategoryPage(1);
    }
  }, [categories, currentCategoryPage]);

  const indexOfLastCategory = currentCategoryPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = Array.isArray(categories)
    ? categories.slice(indexOfFirstCategory, indexOfLastCategory)
    : [];
  const totalCategoryPages = Array.isArray(categories)
    ? Math.ceil(categories.length / itemsPerPage)
    : 1;

  return (
    <div className="relative z-0" style={{ opacity: isProductFormActive ? 0.5 : 1, pointerEvents: isProductFormActive ? 'none' : 'auto' }}>
      {/* Header with title and add button */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-black dark:text-white">
          Categories
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">({categories.length} total)</span>
        </h2>
        <button
          onClick={onAdd}
          className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isProductFormActive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[var(--primary-color)] text-[var(--surface-color)] hover:bg-opacity-90 hover:text-white'
          }`}
          disabled={isProductFormActive}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          <span className="text-sm">Add</span>
        </button>
      </div>

      {/* Categories table */}
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
                  onClick={() => onEdit(category)}
                  className={`text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 ${isProductFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Edit"
                  disabled={isProductFormActive}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                {/* Uncomment if delete functionality is needed */}
                {/*<button
                    onClick={() => onDelete(category._id)}
                    className={`text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 ${isProductFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Delete"
                    disabled={isProductFormActive}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>*/}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {/* Pagination - only show if there are multiple pages */}
      {totalCategoryPages > 1 && (
        <div className="flex justify-between items-center mt-3 px-2">
          <button
            onClick={() => setCurrentCategoryPage(Math.max(currentCategoryPage - 1, 1))}
            disabled={currentCategoryPage === 1 || isProductFormActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
              currentCategoryPage === 1 || isProductFormActive
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[var(--primary-color)] text-[var(--surface-color)] hover:bg-opacity-90 hover:text-white'
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
            disabled={currentCategoryPage === totalCategoryPages || isProductFormActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
              currentCategoryPage === totalCategoryPages || isProductFormActive
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[var(--primary-color)] text-[var(--surface-color)] hover:bg-opacity-90 hover:text-white'
            }`}
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
