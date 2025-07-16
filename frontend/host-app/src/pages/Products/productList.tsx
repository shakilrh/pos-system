import React from 'react';
import {
  TrashIcon,
  PencilIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Category, Product } from './productTypes';

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
                                    }: ProductListProps) {
  const [currentProductPage, setCurrentProductPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState('');

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

  return (
    <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', opacity: isCategoryFormActive ? 0.5 : 1, pointerEvents: isCategoryFormActive ? 'none' : 'auto' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-72">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Search Products</label>
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
          className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${isCategoryFormActive ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: isCategoryFormActive ? undefined : 'var(--primary-color)',
            color: 'var(--text-color-button)',
          }}
          disabled={isCategoryFormActive}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${filterCategory === 'all' || filterCategory === null ? 'bg-[var(--primary-color)] text-[var(--text-color-button)]' : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-color)]'}`}
            style={{ '--tw-ring-color': 'var(--focus-ring)' }}
          >
            All Products
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${filterCategory === 'inactive' ? 'bg-[var(--primary-color)] text-[var(--text-color-button)]' : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-color)]'}`}
            style={{ '--tw-ring-color': 'var(--focus-ring)' }}
          >
            Inactive Products
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleFilterChange(category._id)}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${filterCategory === category._id ? 'bg-[var(--primary-color)] text-[var(--text-color-button)]' : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-color)]'}`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' }}
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
              className={`relative rounded-lg shadow-sm overflow-hidden hover:bg-[var(--background-secondary)] transition-colors duration-200 ${!product.isActive ? 'opacity-50' : ''} w-full max-w-[180px] mx-auto`}
              style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', height: '240px' }}
            >
              <div className="relative h-1/2 cursor-pointer" onClick={() => !isCategoryFormActive && onViewDetails(product)}>
                {product.pictureUrl ? (
                  <img
                    src={product.pictureUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>No Image</span>
                  </div>
                )}
              </div>
              <div className="p-2 flex flex-col justify-between h-1/2">
                <div>
                  <h3 className="text-md font-semibold truncate" style={{ color: 'var(--text-color)' }}>{product.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-medium text-sm" style={{ color: 'var(--primary-color)' }}>{product.displayPrice}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{product.categoryName}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={product.isActive}
                        onChange={() => !isCategoryFormActive && onToggleActive(product)}
                        className="sr-only"
                        disabled={isCategoryFormActive}
                      />
                      <div className={`w-10 h-5 rounded-full transition duration-200 ${product.isActive ? 'bg-[var(--primary-color)]' : 'bg-[var(--background-secondary)]'}`}></div>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[var(--surface-color)] rounded-full shadow transition duration-200 transform ${product.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.isActive ? 'Active' : 'Deactive'}</span>
                  </label>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => !isCategoryFormActive && onEdit(product)}
                      className={`p-0.5 rounded-full hover:bg-[var(--background-secondary)] ${isCategoryFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Edit"
                      disabled={isCategoryFormActive}
                    >
                      <PencilIcon className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
                    </button>
                    {/*<button*/}
                    {/*  onClick={() => !isCategoryFormActive && onDelete(product._id)}*/}
                    {/*  className={`p-0.5 rounded-full hover:bg-[var(--background-secondary)] ${isCategoryFormActive ? 'opacity-50 cursor-not-allowed' : ''}`}*/}
                    {/*  title="Delete"*/}
                    {/*  disabled={isCategoryFormActive}*/}
                    {/*>*/}
                    {/*  <TrashIcon className="w-4 h-4" style={{ color: 'var(--error-color)' }} />*/}
                    {/*</button>*/}
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
            className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentProductPage === 1 || isCategoryFormActive ? 'bg-[var(--bg-gray)] text-[var(--text-color-gray)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-color-button)] hover:bg-[var(--primary-color)]'}`}
            style={{ '--tw-ring-color': 'var(--focus-ring)' }}
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
            className={`flex items-center px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${currentProductPage === totalProductPages || isCategoryFormActive ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-color-button)] hover:bg-[var(--primary-color)]'}`}
            style={{ '--tw-ring-color': 'var(--focus-ring)' }}
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
