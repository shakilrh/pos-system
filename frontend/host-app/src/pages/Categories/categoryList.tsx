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
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}> {/* Use text-color */}
          Categories
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>({categories.length} total)</span> {/* Use text-secondary */}
        </h2>
        <button
          onClick={onAdd}
          className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
            isProductFormActive
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : ''
          }`}
          style={{
            backgroundColor: isProductFormActive ? '' : 'var(--primary-color)',
            color: isProductFormActive ? '' : 'var(--surface-color)'
          }}
          disabled={isProductFormActive}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          <span className="text-sm">Add</span>
        </button>
      </div>

      {/* Categories table */}
      <div className="overflow-x-auto" style={{ backgroundColor: 'var(--surface-color)' }}> {/* Use surface-color for the table background */}
        <table className="w-full text-left text-sm">
          <thead>
          <tr style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-secondary)' }}> {/* Use background-secondary and text-secondary */}
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Actions</th>
          </tr>
          </thead>
          <tbody>
          {currentCategories.map((category, idx) => (
            <tr
              key={category._id}
              className={`border-b`}
              style={{
                borderColor: 'var(--border-color)', // Use border-color
                backgroundColor: idx % 2 === 0 ? 'var(--background-color)' : 'var(--surface-secondary)', // Use background-color and surface-secondary for rows
                color: 'var(--text-color)' // Use text-color for row text
              }}
            >
              <td className="py-3 px-4 font-semibold">{category.name}</td>
              <td className="py-3 px-4 flex space-x-2">
                <button
                  onClick={() => onEdit(category)}
                  className={`p-1 rounded-full ${isProductFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ color: 'var(--info-color)' }} // Use info-color for edit icon
                  title="Edit"
                  disabled={isProductFormActive}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                {/* Uncomment if delete functionality is needed */}
                {/*<button
                    onClick={() => onDelete(category._id)}
                    className={`p-1 rounded-full ${isProductFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ color: 'var(--error-color)' }} // Use error-color for delete icon
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
                : ''
            }`}
            style={{
                backgroundColor: (currentCategoryPage === 1 || isProductFormActive) ? '' : 'var(--primary-color)',
                color: (currentCategoryPage === 1 || isProductFormActive) ? '' : 'var(--surface-color)'
            }}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Prev
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}> {/* Use text-secondary */}
            Page {currentCategoryPage} of {totalCategoryPages}
          </span>
          <button
            onClick={() => setCurrentCategoryPage(Math.min(currentCategoryPage + 1, totalCategoryPages))}
            disabled={currentCategoryPage === totalCategoryPages || isProductFormActive}
            className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
              currentCategoryPage === totalCategoryPages || isProductFormActive
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : ''
            }`}
            style={{
                backgroundColor: (currentCategoryPage === totalCategoryPages || isProductFormActive) ? '' : 'var(--primary-color)',
                color: (currentCategoryPage === totalCategoryPages || isProductFormActive) ? '' : 'var(--surface-color)'
            }}
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}