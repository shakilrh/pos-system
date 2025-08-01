import React, { useState, useEffect } from 'react';
import {ShoppingBagIcon, XMarkIcon} from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  displayPrice: string;
  isActive: boolean;
  time_required?: number;
}

interface Category {
  _id: string;
  name: string;
}

export interface OrderMenuProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  categories: Category[];
  filteredProducts: Product[];
  addProductToOrder: (product: Product) => void;
  currentCurrency?: string;
}

const OrderMenu = ({
                     searchTerm,
                     setSearchTerm,
                     selectedCategory,
                     setSelectedCategory,
                     categories,
                     filteredProducts,
                     addProductToOrder,
                     currentCurrency: propCurrency = 'pkr',
                   }: OrderMenuProps) => {

  // Local state for currency to ensure reactivity
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
    // Priority: DOM attribute > prop > localStorage > default
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');

    return domCurrency || propCurrency || storedCurrency || 'pkr';
  };

  // Update currency when prop changes
  useEffect(() => {
    console.log('OrderMenu: Currency prop changed to:', propCurrency);
    setActiveCurrency(propCurrency);
  }, [propCurrency]);

  // Listen for currency changes from the app
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      console.log('OrderMenu: Received currency change event:', event.detail);
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== activeCurrency) {
        setActiveCurrency(newCurrency);
        console.log('OrderMenu: Currency updated to:', newCurrency);
      }
    };

    const handleSettingsLoaded = (event: CustomEvent) => {
      console.log('OrderMenu: Received settings loaded event:', event.detail);
      const newCurrency = event.detail.currency;
      if (newCurrency) {
        setActiveCurrency(newCurrency);
        console.log('OrderMenu: Currency loaded as:', newCurrency);
      }
    };

    const handleForceRerender = (event: CustomEvent) => {
      console.log('OrderMenu: Received force rerender event:', event.detail);
      if (event.detail.type === 'currency') {
        const newCurrency = event.detail.value;
        setActiveCurrency(newCurrency);
        console.log('OrderMenu: Currency force updated to:', newCurrency);
      }
    };

    // Add event listeners
    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    // Initial currency check
    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      console.log('OrderMenu: Setting initial currency to:', initialCurrency);
      setActiveCurrency(initialCurrency);
    }

    // Cleanup
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency]);

  // Debug logging
  useEffect(() => {
    console.log('OrderMenu: Active currency is now:', activeCurrency);
    console.log('OrderMenu: Currency symbol:', getCurrencySymbol(activeCurrency));
  }, [activeCurrency]);

  return (
      <div className="relative space-y-3 p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
        {/* Header */}
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center mb-4">
            <button className="mr-2" style={{ color: 'var(--text-secondary)' }}>
              <ShoppingBagIcon className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
              Menu Items
            </h3>
          </div>
        </div>

        {/* Search and Category Filter */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200"
                  style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
              />
              {searchTerm && (
                  <XMarkIcon
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-3.5 h-5 w-5 cursor-pointer hover:text-[var(--error-color-hover)]"
                      style={{ color: 'var(--button-inactive-text, var(--text-secondary))' }}
                  />
              )}
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedCategory === ''
                          ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                          : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
                  }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                  <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category._id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          selectedCategory === category._id
                              ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                              : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary{bp1}secondary))] hover:bg-[var(--surface-secondary)]'
                      }`}
                  >
                    {category.name}
                  </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
                <div
                    key={product._id}
                    onClick={() => addProductToOrder(product)}
                    className="group relative rounded-lg p-3 flex flex-col items-center cursor-pointer border hover:border-[var(--primary-color)] hover:shadow-md transition-all duration-200"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: 'var(--cardBackground)',
                      minHeight: '180px'
                    }}
                >
                  {/* Time Required Badge */}
                  {product.time_required && (
                      <span
                          className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium z-10"
                          style={{
                            color: 'var(--info-color)',
                            backgroundColor: 'var(--background-secondary)',
                            border: '1px solid var(--border-color)'
                          }}
                      >
                  {product.time_required}m
                </span>
                  )}

                  {/* Product Image */}
                  <div className="w-20 h-20 mb-3 flex items-center justify-center overflow-hidden rounded-md" style={{ backgroundColor: product.pictureUrl ? 'transparent' : 'var(--background-secondary)' }}>
                    {product.pictureUrl ? (
                        <img
                            src={product.pictureUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="w-full text-center">
                    <h3
                        className="text-sm font-semibold mb-1 line-clamp-2"
                        style={{ color: 'var(--headingText)' }}
                    >
                      {product.name}
                    </h3>
                    <span
                        className="text-sm font-bold mt-auto"
                        style={{ color: 'var(--success-color)' }}
                        key={`${product._id}-${activeCurrency}`} // Force re-render when currency changes
                    >
                  {formatPrice(product.price, activeCurrency)}
                </span>
                  </div>

                  {/* Updated Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">

                  </div>
                </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <p style={{ color: 'var(--text-secondary)' }}>No products found matching your criteria</p>
              </div>
          )}
        </div>
      </div>
  );
};

export default OrderMenu;