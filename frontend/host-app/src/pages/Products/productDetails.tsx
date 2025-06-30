import React from 'react';
import { XMarkIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Product } from './productTypes';

interface ProductDetailsProps {
  product: Product;
  onCancel: () => void;
}

export default function ProductDetails({ product, onCancel }: ProductDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100 hover:scale-[1.02] border border-gray-200 dark:border-gray-700">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white drop-shadow-sm">Product Details</h3>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Product Image */}
          <div className="mb-3 relative">
            {product.pictureUrl ? (
              <div className="relative group">
                <img
                  src={product.pictureUrl}
                  alt={product.name}
                  className="w-full h-24 object-contain rounded-lg shadow-md"
                  onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200x100?text=No+Image'; }}
                />
              </div>
            ) : (
              <div className="w-full h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                <span className="text-gray-500 dark:text-gray-400 text-xs">No Image Available</span>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-2">
            {/* Product Name */}
            <div className="text-center mb-2">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{product.name}</h4>
              <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {product.categoryName}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {product.isActive ? (
                    <>
                      <CheckCircleIcon className="w-2.5 h-2.5 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="w-2.5 h-2.5 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
              <div className="text-center">
                <span className="text-lg font-bold text-green-700 dark:text-green-300">{product.displayPrice}</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Description</h5>
                <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Preparation Time */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-center">
                <ClockIcon className="w-3 h-3 text-orange-600 dark:text-orange-400 mr-1.5" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300 mr-1">Prep Time:</span>
                <span className="text-sm font-bold text-orange-800 dark:text-orange-200">{product.time_required} min</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
