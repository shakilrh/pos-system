import React from 'react';
import { TrashIcon, PencilIcon, PlusCircleIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/solid';
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const itemsPerPage = 10;

  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  React.useEffect(() => {
    const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentProductPage > totalProductPages && totalProductPages > 0) {
      setCurrentProductPage(totalProductPages);
    } else if (filteredProducts.length === 0) {
      setCurrentProductPage(1);
    }
  }, [filteredProducts, currentProductPage]);

  // Reset to first page when search term changes
  React.useEffect(() => {
    setCurrentProductPage(1);
  }, [searchTerm]);

  const indexOfLastProduct = currentProductPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="relative z-0" style={{ opacity: isCategoryFormActive ? 0.5 : 1, pointerEvents: isCategoryFormActive ? 'none' : 'auto' }}>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pr-10 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isCategoryFormActive}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-2 rounded-lg mr-2">Products</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredProducts.length} items</span>
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={isCategoryFormActive}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          <span className="text-sm">Add Product</span>
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Category</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'all' || filterCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => handleFilterChange('inactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'inactive'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Inactive Products
          </button>
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleFilterChange(category._id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === category._id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      {currentProducts.length > 0 ? (
        <div className="grid grid-cols-5 gap-2">
          {currentProducts.map((product) => (
            <div
              key={`product-${product._id}`}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-300 ${!product.isActive ? 'opacity-50' : ''}`}
              style={{ height: '240px', width: '180px' }}
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
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <span className="text-gray-600 dark:text-gray-400">No Image</span>
                  </div>
                )}
              </div>
              <div className="p-2 flex flex-col justify-between h-1/2">
                <div>
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-blue-400 dark:text-blue-600 font-medium text-sm">{product.displayPrice}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{product.categoryName}</p>
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
                      <div className={`w-10 h-5 rounded-full transition duration-200 ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition duration-200 transform ${product.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{product.isActive ? 'Active' : 'Deactive'}</span>
                  </label>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => !isCategoryFormActive && onEdit(product)}
                      className="text-blue-600 dark:hover:text-blue-400 p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Edit"
                      disabled={isCategoryFormActive}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => !isCategoryFormActive && onDelete(product._id)}
                      className="text-red-600 dark:hover:text-red-400 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                      title="Delete"
                      disabled={isCategoryFormActive}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          {filteredProducts.length === 0 && searchTerm ?
            `No products found matching "${searchTerm}"` :
            filteredProducts.length === 0 ?
              'No products available' :
              'No products found for this filter'
          }
        </div>
      )}
      {totalProductPages > 0 && (
        <div className="flex justify-between items-center mt-4 px-4">
          <button
            onClick={() => !isCategoryFormActive && setCurrentProductPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentProductPage === 1 || isCategoryFormActive}
            className={`flex items-center px-4 py-2 rounded-lg ${currentProductPage === 1 || isCategoryFormActive ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">Page {currentProductPage} of {totalProductPages}</span>
          <button
            onClick={() => !isCategoryFormActive && setCurrentProductPage((prev) => Math.min(prev + 1, totalProductPages))}
            disabled={currentProductPage === totalProductPages || isCategoryFormActive}
            className={`flex items-center px-4 py-2 rounded-lg ${currentProductPage === totalProductPages || isCategoryFormActive ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
          >
            Next
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
