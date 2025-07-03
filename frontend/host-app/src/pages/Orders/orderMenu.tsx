import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
}

const OrderMenu = ({
                     searchTerm,
                     setSearchTerm,
                     selectedCategory,
                     setSelectedCategory,
                     categories,
                     filteredProducts,
                     addProductToOrder,
                   }: OrderMenuProps) => {
  return (
    <div className="lg:w-2/3 w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Items</h2>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        />
        {searchTerm && (
          <XMarkIcon
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedCategory === '' ? 'bg-[var(--primary-color)] text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
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
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-4 max-h-96 overflow-y-auto">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            onClick={() => addProductToOrder(product)}
            className="bg-white rounded-lg p-2 flex flex-col items-center cursor-pointer border border-gray-200 hover:border-2 hover:border-indigo-500 hover:shadow-md transition-all duration-200 relative"
            style={{ minHeight: '90px', minWidth: '120px' }}
          >
            <img
              src={product.pictureUrl || 'https://via.placeholder.com/96'}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-md mb-1"
            />
            {product.time_required && (
              <span className="absolute top-0.5 right-0.5 text-[7px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 font-medium leading-none">
                {product.time_required}m
              </span>
            )}
            <span className="text-[10px] font-semibold text-gray-800 text-center leading-tight px-1">{product.name}</span>
            <span className="text-[10px] text-green-600 mt-0.5 font-medium">${product.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderMenu;
