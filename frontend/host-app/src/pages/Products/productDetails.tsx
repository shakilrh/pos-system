import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Product } from './productTypes';

interface ProductDetailsProps {
  product: Product;
  onCancel: () => void;
}

export default function ProductDetails({ product, onCancel }: ProductDetailsProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01]"
        style={{ backgroundColor: 'var(--background-color)' }}
      >
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
        <div className="h-48 flex items-center justify-center overflow-hidden">
          {product.pictureUrl ? (
            <img
              src={product.pictureUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>No Image</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h4 className="text-sm font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Product Name</h4>
              <p className="text-md font-semibold" style={{ color: 'var(--text-color)' }}>{product.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Price</h4>
              <p className="text-md font-semibold" style={{ color: 'var(--accent-color)' }}>{product.displayPrice}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Category</h4>
              <p className="text-md font-semibold" style={{ color: 'var(--text-color)' }}>{product.categoryName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Last Updated</h4>
              <p className="text-md font-semibold" style={{ color: 'var(--text-color)' }}>
                {product.updatedAt ? formatDate(product.updatedAt) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}
              style={{
                backgroundColor: product.isActive ? 'var(--success-color)' : 'var(--error-color)',
                color: 'var(--surface-color)',
              }}
            >
              {product.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div
              className="rounded-lg p-3"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <h5 className="text-xs font-medium uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Description</h5>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-color)' }}>
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 flex justify-center"
          style={{ backgroundColor: 'var(--background-secondary)' }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:opacity-90"
            style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-color)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}