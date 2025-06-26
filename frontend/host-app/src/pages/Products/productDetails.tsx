import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Product } from './productTypes';

interface ProductDetailsProps {
  product: Product;
  onCancel: () => void;
}

export default function ProductDetails({ product, onCancel }: ProductDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Details</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            {product.pictureUrl ? (
              <img
                src={product.pictureUrl}
                alt={product.name}
                className="w-full h-48 object-contain rounded-lg"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">No Image Available</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h4>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{product.displayPrice}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h4>
              <p className="text-lg text-gray-900 dark:text-white">{product.categoryName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
              <p className="text-gray-700 dark:text-gray-300">{product.description || 'No description provided'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Preparation Time</h4>
              <p className="text-lg text-gray-900 dark:text-white">{product.time_required} minutes</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
              <p className="text-lg text-gray-900 dark:text-white">{product.isActive ? 'Active' : 'Deactive'}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
