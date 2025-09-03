import React from 'react';
import {
  TrashIcon,
  PencilIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { Category, Product } from './productTypes';
import { useAuth } from '../../context/AuthContext';

interface ProductListProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  filterCategory: string | null;
  handleFilterChange: (value: string) => void;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  isCategoryFormActive: boolean;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onViewDetails: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  currentCurrency?: string;
}

export default function ProductList({
                                      token,
                                      isAuthenticated,
                                      logout,
                                      categories,
                                      filterCategory,
                                      handleFilterChange,
                                      products,
                                      setProducts,
                                      isCategoryFormActive,
                                      onAdd,
                                      onEdit,
                                      onDelete,
                                      onViewDetails,
                                      onToggleActive,
                                      currentCurrency: propCurrency = 'pkr',
                                    }: ProductListProps) {
  const { userPermissions, permissionsLoaded } = useAuth();
  const [currentProductPage, setCurrentProductPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCurrency, setActiveCurrency] = React.useState(propCurrency);

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
  React.useEffect(() => {
    setActiveCurrency(propCurrency);
  }, [propCurrency]);

  // Listen for currency changes from the app
  React.useEffect(() => {
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

  const calculateItemsPerPage = React.useCallback(() => {
    const screenWidth = window.innerWidth;
    let columns = 1;
    if (screenWidth >= 1536) columns = 6;
    else if (screenWidth >= 1280) columns = 5;
    else if (screenWidth >= 1024) columns = 4;
    else if (screenWidth >= 768) columns = 3;
    else if (screenWidth >= 640) columns = 2;
    const headerHeight = 200;
    const paginationHeight = 80;
    const productCardHeight = 240;
    const gap = 12;
    const availableHeight = window.innerHeight - headerHeight - paginationHeight;
    const maxRows = Math.max(2, Math.floor(availableHeight / (productCardHeight + gap)));
    return columns * maxRows;
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = calculateItemsPerPage();
      setItemsPerPage(newItemsPerPage);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateItemsPerPage]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).filter(product => {
      if (filterCategory === 'all' || filterCategory === null) return true;
      if (filterCategory === 'inactive') return !product.isActive;
      return product.category_id === filterCategory;
    });
  }, [products, filterCategory, searchQuery]);

  React.useEffect(() => {
    const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentProductPage > totalProductPages && totalProductPages > 0) {
      setCurrentProductPage(totalProductPages);
    } else if (filteredProducts.length === 0) {
      setCurrentProductPage(1);
    }
  }, [filteredProducts, currentProductPage, itemsPerPage]);

  const indexOfLastProduct = currentProductPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (!permissionsLoaded) {
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
    <div>
      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center space-x-2">
          <ShoppingBagIcon className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Product Management</h3>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-72">
          <label className="block text-sm font-medium mb-2 mt-2" style={{ color: 'var(--text-secondary)' }}>Search Products</label>
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
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
        {userPermissions.includes('can_add_products') && (
            <button
                onClick={onAdd}
                className={`flex items-center px-2.5 py-1.5 mt-9 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${isCategoryFormActive ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
                style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                disabled={isCategoryFormActive}
            >
              <PlusCircleIcon className="w-4 h-4 mr-1" />
              <span>Add Product</span>
            </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          <button
              onClick={() => handleFilterChange('all')}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${filterCategory === 'all' || filterCategory === null ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]' : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'}`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
          >
            All Products
          </button>
          <button
              onClick={() => handleFilterChange('inactive')}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${filterCategory === 'inactive' ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]' : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'}`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
          >
            Inactive Products
          </button>
          {categories.map((category) => (
              <button
                  key={category._id}
                  onClick={() => handleFilterChange(category._id)}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${filterCategory === category._id ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]' : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'}`}
                  style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
              >
                {category.name}
              </button>

          ))}
        </div>
      </div>

      <div className="mb-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Showing {itemsPerPage} items per page
      </div>

      {currentProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 w-full">
          {currentProducts.map((product) => (
              <div
                  key={`product-${product._id}`}
                  className={`relative rounded-lg shadow-sm overflow-hidden hover:bg-[var(--background-secondary)] transition-colors duration-200 w-full max-w-[180px] mx-auto`}
                  style={{
                    backgroundColor: 'var(--background-color)',
                    border: '1px solid var(--border-color)',
                    height: '240px'
                  }}
              >
                <div className={`relative h-1/2 cursor-pointer ${!product.isActive ? 'opacity-50' : ''}`} onClick={() => !isCategoryFormActive && onViewDetails(product)}>
                  {product.pictureUrl ? (
                      <img

                          src={product.pictureUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                      />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                        <PhotoIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                  )}
                </div>
                <div className="p-2 flex flex-col justify-between h-1/2">
                  <div className={!product.isActive ? 'opacity-50' : ''}>
                    <h3 className="text-md font-semibold truncate" style={{ color: 'var(--text-color)' }}>{product.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--primary-color)' }} key={`${product._id}-${activeCurrency}`}>
                        {formatPrice(product.price, activeCurrency)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{product.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    {userPermissions.includes('can_edit_products') && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <div className="relative">
                            <input
                                type="checkbox"
                                checked={product.isActive}
                                onChange={() => !isCategoryFormActive && onToggleActive(product)}
                                className="sr-only"
                                disabled={isCategoryFormActive}
                            />
                            <div
                                className={`w-10 h-5 rounded-full transition duration-200 ${product.isActive ? 'bg-[var(--primary-color)]' : 'bg-gray-300'}`}
                            ></div>
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--surface-color)] rounded-full shadow transition duration-200 transform ${product.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                            ></div>
                          </div>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.isActive ? 'Active' : 'Deactive'}</span>
                        </label>
                    )}
                    <div className={`flex space-x-1 ${!product.isActive ? 'opacity-50' : ''}`}>
                      {userPermissions.includes('can_edit_products') && (
                          <button
                              onClick={() => !isCategoryFormActive && onEdit(product)}
                              className={`p-0.5 rounded-full hover:bg-[var(--background-secondary)] ${isCategoryFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Edit"
                              disabled={isCategoryFormActive}
                          >
                            <PencilIcon className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
                          </button>
                      )}

                      {/*{userPermissions.includes('can_delete_products') && (*/}
                      {/*    <button*/}
                      {/*        onClick={() => !isCategoryFormActive && onDelete(product._id)}*/}
                      {/*        className={`p-0.5 rounded-full hover:bg-red-100 ${isCategoryFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}*/}
                      {/*        title="Delete"*/}
                      {/*        disabled={isCategoryFormActive}*/}
                      {/*    >*/}
                      {/*      <TrashIcon className="w-4 h-4" style={{ color: 'red' }} />*/}
                      {/*    </button>*/}
                      {/*)}*/}
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
          {filteredProducts.length === 0 ? 'No products available' : 'No products found for this filter'}
        </div>
      )}

      {totalProductPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-4">
          <button
              onClick={() => !isCategoryFormActive && setCurrentProductPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentProductPage === 1 || isCategoryFormActive}
              className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentProductPage === 1 || isCategoryFormActive ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Previous
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page {currentProductPage} of {totalProductPages} • {itemsPerPage} items per page
          </span>
          <button
              onClick={() => !isCategoryFormActive && setCurrentProductPage((prev) => Math.min(prev + 1, totalProductPages))}
              disabled={currentProductPage === totalProductPages || isCategoryFormActive}
              className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentProductPage === totalProductPages || isCategoryFormActive ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
