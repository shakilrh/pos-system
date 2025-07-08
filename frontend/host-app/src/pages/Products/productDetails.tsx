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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-[var(--primary-color)] to-[var(--primary-color)]/80 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[var(--surface-color)]">Product Details</h3>
            <button
              onClick={onCancel}
              className="text-[var(--surface-color)] hover:text-[var(--surface-color)]/70 transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Image */}
        <div className="relative -mt-8 flex justify-center">
          <div className="relative">
            {product.pictureUrl ? (
              <img
                src={product.pictureUrl}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 shadow-lg">
                <span className="text-gray-500 dark:text-gray-400 text-xs">No Image</span>
              </div>
            )}
            {/* Status Badge */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 ${
              product.isActive
                ? 'bg-green-500'
                : 'bg-red-500'
            }`}>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 pt-2 space-y-3">
          {/* Product Name */}
          <div className="text-center">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h4>
            <p className="text-2xl font-bold text-[var(--primary-color)] mt-1">{product.displayPrice}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{product.categoryName}</span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prep Time</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{product.time_required} min</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              product.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
            }`}>
              {product.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">Description</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 flex justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-[var(--surface-color)] rounded-lg transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
