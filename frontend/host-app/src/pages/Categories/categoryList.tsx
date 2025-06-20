import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import { Category } from './categoryTypes';

interface CategoryListProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  tableErrorMessage: string | null;
  setTableErrorMessage: (message: string | null) => void;
  currentCategoryPage: number;
  setCurrentCategoryPage: (page: number) => void;
  itemsPerPage: number;
  isProductFormActive: boolean;
  onAdd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export default function CategoryList({
                                       token,
                                       isAuthenticated,
                                       logout,
                                       categories,
                                       setCategories,
                                       tableErrorMessage,
                                       setTableErrorMessage,
                                       currentCategoryPage,
                                       setCurrentCategoryPage,
                                       itemsPerPage,
                                       isProductFormActive,
                                       onAdd,
                                       onEdit,
                                       onDelete,
                                     }: CategoryListProps) {
  const indexOfLastCategory = currentCategoryPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = Array.isArray(categories) ? categories.slice(indexOfFirstCategory, indexOfLastCategory) : [];
  const totalCategoryPages = Array.isArray(categories) ? Math.ceil(categories.length / itemsPerPage) : 1;

  return (
    <div className="relative z-0" style={{ opacity: isProductFormActive ? 0.5 : 1, pointerEvents: isProductFormActive ? 'none' : 'auto' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 p-2 rounded-lg mr-2">
            Categories
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{categories.length} total</span>
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          disabled={isProductFormActive}
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
                  onClick={() => onEdit(category)}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  title="Edit"
                  disabled={isProductFormActive}
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(category)}
                  className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
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
      {tableErrorMessage && (
        <div className="mt-4 text-red-500 dark:text-red-400 text-center text-sm">{tableErrorMessage}</div>
      )}
      {totalCategoryPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <button
            onClick={() => setCurrentCategoryPage(Math.max(currentCategoryPage - 1, 1))}
            disabled={currentCategoryPage === 1 || isProductFormActive}
            className={`flex items-center px-3 py-1 rounded-lg ${
              currentCategoryPage === 1 || isProductFormActive ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700'
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
            className={`flex items-center px-3 py-1 rounded-lg ${
              currentCategoryPage === totalCategoryPages || isProductFormActive ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700'
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
