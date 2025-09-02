import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    PlusCircleIcon, TagIcon
} from '@heroicons/react/24/outline';
import { Category } from './categoryTypes';
import FlashMessage from '../FlashMessage';
import { useAuth } from '../../context/AuthContext'; // Add this import
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
  const { userPermissions, permissionsLoaded } = useAuth(); // Add this
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

  if (!permissionsLoaded) { // Add this loading check
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background-color)' }}>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Loading permissions...</p>
        </div>
      </div>
    );
  }
  return (

      <div className="relative">
          <div className="rounded-lg p-3 shadow-lg"
               style={{backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)'}}>
              <div className="flex items-center space-x-2">
                  <TagIcon className="w-5 h-5" style={{color: 'var(--accent-color)'}}/>
                  <h3 className="text-lg font-semibold" style={{color: 'var(--text-color)'}}>Category Management</h3>
              </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="w-full sm:w-72">
                  <label className="block text-sm font-medium mb-2 mt-2" style={{color: 'var(--text-secondary)'}}>Search
                      Categories</label>
                  <div className="relative">
                      <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-2.5 py-1.5 pl-10 text-sm rounded-lg border focus:ring-2 transition-colors duration-200"
                          style={{
                              borderColor: 'var(--border-color)',
                              backgroundColor: 'var(--background-color)',
                              color: 'var(--text-color)',
                              outlineColor: 'var(--focus-ring)',
                          }}
                          placeholder="Search by name..."
                      />
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                                           style={{color: 'var(--text-tertiary)'}}/>
                  </div>
              </div>

            {userPermissions.includes('can_add_categories') && ( // Wrap Add button
                <button
                    onClick={onAdd}
                    className={`flex items-center px-2.5 py-1.5 mt-9 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${isProductFormActive ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
                    style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                    disabled={isProductFormActive}
                >
                    <PlusCircleIcon className="w-4 h-4 mr-1" />
                    <span>Add</span>
                </button>
            )}
          </div>


        {isAuthenticated && (
              <>
                  {currentCategories.length === 0 ? (
                      <div className="text-center py-10">
                          <div className="w-12 h-12 mx-auto mb-4" style={{color: 'var(--text-tertiary)'}}></div>
                          <p className="text-sm" style={{color: 'var(--text-secondary)'}}>No categories found</p>
                      </div>
                  ) : (
                      <div className="overflow-x-auto">
                          <table className="min-w-full divide-y" style={{borderColor: 'var(--border-color)'}}>
                              <thead style={{backgroundColor: 'var(--background-secondary)'}}>
                              <tr>
                                  <th className="py-3 text-left text-xs font-medium uppercase tracking-wider"
                                      style={{color: 'var(--text-secondary)'}}>Name
                                  </th>
                                  <th className=" py-3 text-right text-xs font-medium uppercase tracking-wider"
                                      style={{color: 'var(--text-secondary)'}}>Actions
                                  </th>
                              </tr>
                              </thead>
                              <tbody className="divide-y" style={{
                                  backgroundColor: 'var(--background-color)',
                                  borderColor: 'var(--border-color)'
                              }}>
                              {currentCategories.map((category) => (
                                  <tr key={category._id} className="transition-colors duration-150">
                                      <td
                                          className=" py-3 whitespace-nowrap text-sm font-medium cursor-pointer hover:underline"
                                          style={{color: 'var(--primary-color)'}}
                                          onClick={() => handleCategoryClick(category)}
                                      >
                                          {category.name}
                                      </td>

                                        <td className="py-3 whitespace-nowrap text-right text-sm font-medium">
                                          {userPermissions.includes('can_edit_categories') && ( // Wrap Edit button
                                            <button
                                              onClick={() => onEdit(category)}
                                              className="mr-4"
                                              style={{color: 'var(--primary-color)'}}
                                              title="Edit"
                                              disabled={isProductFormActive}
                                            >
                                              <PencilIcon className="w-5 h-5"/>
                                            </button>
                                          )}
                                          {/*{userPermissions.includes('can_delete_categories') && ( // Wrap Delete button (uncommented)*/}
                                          {/*  <button*/}
                                          {/*    onClick={() => onDelete(category._id)}*/}
                                          {/*    disabled={isProductFormActive}*/}
                                          {/*    className="disabled:opacity-50"*/}
                                          {/*    style={{ color: 'var(--error-color)' }}*/}
                                          {/*    title="Delete"*/}
                                          {/*  >*/}
                                          {/*    <TrashIcon className="w-5 h-5" />*/}
                                          {/*  </button>*/}
                                          {/*)}*/}
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
                              className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentPage === 1 || isProductFormActive ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
                              style={{ '--tw-ring-color': 'var(--focus-ring)', borderColor: 'var(--border-color)' } as React.CSSProperties}
                          >
                              Previous
                          </button>
                          {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                              <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentPage === page ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]' : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'}`}
                                  style={{ '--tw-ring-color': 'var(--focus-ring)', borderColor: 'var(--border-color)' } as React.CSSProperties}
                              >
                                  {page}
                              </button>
                          ))}
                          <button
                              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages || isProductFormActive}
                              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentPage === totalPages || isProductFormActive ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
                              style={{ '--tw-ring-color': 'var(--focus-ring)', borderColor: 'var(--border-color)' } as React.CSSProperties}
                          >
                              Next
                          </button>
                      </div>
                  )}
              </>
          )}

          {selectedCategory && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
                   style={{zIndex: 9999}}>
                  <div
                      className="rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01]"
                      style={{backgroundColor: 'var(--surface-color)'}}>
                      {/* Header with gradient background */}
                      <div className="relative p-4"
                           style={{background: `linear-gradient(135deg, var(--primary-color), var(--primary-color)cc)`}}>
                          <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold" style={{color: 'var(--surface-color)'}}>Category
                                  Details</h3>
                              <button
                                  onClick={closeModal}
                                  className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/10"
                                  style={{color: 'var(--surface-color)'}}
                              >
                                  <XMarkIcon className="w-5 h-5"/>
                              </button>
                          </div>
                      </div>

                      {/* Category Icon */}
                      <div className="relative -mt-8 flex justify-center">
                          <div className="relative">
                              <div
                                  className="w-24 h-24 flex items-center justify-center rounded-full border-4 shadow-lg"
                                  style={{
                                      backgroundColor: 'var(--primary-color)',
                                      borderColor: 'var(--surface-color)'
                                  }}>
                  <span className="text-2xl font-bold" style={{color: 'var(--surface-color)'}}>
                    {selectedCategory.name.charAt(0).toUpperCase()}
                  </span>
                              </div>
                          </div>
                      </div>

                      {/* Category Info */}
                      <div className="p-4 pt-2 space-y-3">
                          {/* Category Name */}
                          <div className="text-center">
                              <h4 className="text-xl font-bold"
                                  style={{color: 'var(--text-color)'}}>{selectedCategory.name}</h4>
                          </div>

                          {/* Description */}
                          {selectedCategory.description && (
                              <div className="rounded-lg p-3" style={{backgroundColor: 'var(--background-secondary)'}}>
                                  <h5 className="text-xs font-medium uppercase mb-2"
                                      style={{color: 'var(--text-secondary)'}}>Description</h5>
                                  <p className="text-sm leading-relaxed" style={{color: 'var(--text-color)'}}>
                                      {selectedCategory.description}
                                  </p>
                              </div>
                          )}

                          {!selectedCategory.description && (
                              <div className="rounded-lg p-3" style={{backgroundColor: 'var(--background-secondary)'}}>
                                  <p className="text-sm text-center" style={{color: 'var(--text-secondary)'}}>
                                      No description provided
                                  </p>
                              </div>
                          )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-3 flex justify-center"
                           style={{backgroundColor: 'var(--background-secondary)'}}>
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
