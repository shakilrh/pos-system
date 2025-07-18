import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
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
  const itemsPerPage = 11;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (categories.length === 0) {
      setCurrentPage(1);
    }
  }, [categories, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const closeModal = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="relative z-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-72">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Search Categories</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 pl-10 text-sm rounded-lg border focus:ring-2 transition-colors duration-200"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--background-color)',
                color: 'var(--text-color)',
                outlineColor: 'var(--focus-ring)',
              }}
              placeholder="Search by name..."
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        <button
          onClick={onAdd}
          className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${isProductFormActive ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
          // FIX: Cast the style object to React.CSSProperties
          style={{
            backgroundColor: isProductFormActive ? undefined : 'var(--primary-color)',
            color: isProductFormActive ? undefined : 'var(--text-on-primary)',
            '--tw-ring-color': 'var(--focus-ring)',
          } as React.CSSProperties}
          disabled={isProductFormActive}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          <span>Add Category</span>
        </button>
      </div>

      {isAuthenticated && (
        <>
          {currentCategories.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }}></div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No categories found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <thead style={{ backgroundColor: 'var(--background-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)' }}>
                {currentCategories.map((category) => (
                  <tr key={category._id} className="transition-colors duration-150">
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium cursor-pointer hover:underline"
                      style={{ color: 'var(--primary-color)' }}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEdit(category)}
                        className="mr-4"
                        style={{ color: 'var(--primary-color)' }}
                        title="Edit"
                        disabled={isProductFormActive}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      {/*<button*/}
                      {/*  onClick={() => onDelete(category._id)}*/}
                      {/*  disabled={isProductFormActive}*/}
                      {/*  className="disabled:opacity-50"*/}
                      {/*  style={{ color: 'var(--error-color)' }}*/}
                      {/*  title="Delete"*/}
                      {/*>*/}
                      {/*  <TrashIcon className="w-5 h-5" />*/}
                      {/*</button>*/}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isProductFormActive}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${currentPage === page ? 'text-white' : ''}`}
                  style={{
                    backgroundColor: currentPage === page ? 'var(--primary-color)' : 'var(--background-secondary)',
                    color: currentPage === page ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || isProductFormActive}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01]" style={{ backgroundColor: 'var(--surface-color)' }}>
            {/* Header with gradient background */}
            <div className="relative p-4" style={{ background: `linear-gradient(135deg, var(--primary-color), var(--primary-color)cc)` }}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold" style={{ color: 'var(--surface-color)' }}>Category Details</h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
                  style={{ color: 'var(--surface-color)' }}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Category Icon */}
            <div className="relative -mt-8 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 flex items-center justify-center rounded-full border-4 shadow-lg" style={{
                  backgroundColor: 'var(--primary-color)',
                  borderColor: 'var(--surface-color)'
                }}>
                  <span className="text-2xl font-bold" style={{ color: 'var(--surface-color)' }}>
                    {selectedCategory.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Info */}
            <div className="p-4 pt-2 space-y-3">
              {/* Category Name */}
              <div className="text-center">
                <h4 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>{selectedCategory.name}</h4>
              </div>

              {/* Description */}
              {selectedCategory.description && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
                  <h5 className="text-xs font-medium uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Description</h5>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-color)' }}>
                    {selectedCategory.description}
                  </p>
                </div>
              )}

              {!selectedCategory.description && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
                  <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
                    No description provided
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 flex justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--surface-color)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}