import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Product } from './productTypes';

interface ProductDetailsProps {
  product: Product;
  onCancel: () => void;
  currentCurrency?: string;
}

export default function ProductDetails({ product, onCancel, currentCurrency: propCurrency = 'pkr' }: ProductDetailsProps) {
  const [activeCurrency, setActiveCurrency] = useState(propCurrency);

  // Function to get currency symbol based on current currency
  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      pkr: '₨',
      dollar: '$',
      euro: '€'
    };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  // Function to format price with currency
  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
  };

  // Function to get current currency from various sources
  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || propCurrency || storedCurrency || 'pkr';
  };

  // Update currency when prop changes
  useEffect(() => {
    setActiveCurrency(propCurrency);
  }, [propCurrency]);

  // Listen for currency changes from the app
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== activeCurrency) {
        setActiveCurrency(newCurrency);
      }
    };

    const handleSettingsLoaded = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency) {
        setActiveCurrency(newCurrency);
      }
    };

    const handleForceRerender = (event: CustomEvent) => {
      if (event.detail.type === 'currency') {
        const newCurrency = event.detail.value;
        setActiveCurrency(newCurrency);
      }
    };

    // Add event listeners
    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    // Initial currency check
    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      setActiveCurrency(initialCurrency);
    }

    // Cleanup
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency, propCurrency]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9998 }}>
      <div className="rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 hover:scale-[1.01]" style={{ backgroundColor: 'var(--surface-color)' }}>
        {/* Header with gradient background */}
        <div className="relative p-4" style={{ background: `linear-gradient(135deg, var(--primary-color), var(--primary-color)cc)` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold" style={{ color: 'var(--surface-color)' }}>Product Details</h3>
            <button
              onClick={onCancel}
              className="transition-colors p-1 rounded-full hover:bg-white/10"
              style={{ color: 'var(--surface-color)' }}
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
                className="w-24 h-24 object-cover rounded-full border-4 shadow-lg"
                style={{ borderColor: 'var(--surface-color)' }}
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center rounded-full border-4 shadow-lg" style={{
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--surface-color)'
              }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>No Image</span>
              </div>
            )}
            {/* Status Badge */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
              product.isActive
                ? 'bg-green-500'
                : 'bg-red-500'
            }`} style={{ borderColor: 'var(--surface-color)' }}>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 pt-2 space-y-3">
          {/* Product Name */}
          <div className="text-center">
            <h4 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>{product.name}</h4>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--primary-color)' }} key={`${product._id}-${activeCurrency}`}>
              {formatPrice(product.price, activeCurrency)}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Category</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>{product.categoryName}</span>
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-secondary)' }}>Prep Time</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>{product.time_required} min</span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
              product.isActive
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {product.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <h5 className="text-xs font-medium uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Description</h5>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-color)' }}>
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
          <button
            onClick={onCancel}
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
  );
}
