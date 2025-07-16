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
    <div className="min-h-screen bg-[var(--background-color)] py-4">
      <div className="lg:grid lg:grid-cols-10 lg:gap-6">
        <div className="lg:col-span-10">
          <div
            className="rounded-lg shadow-md border w-full mx-auto p-6"
            style={{
              backgroundColor: 'var(--cardBackground)',
              borderColor: '#4a4a4a',
              color: 'var(--cardText)',
            }}
          >
            <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--headingText)' }}>
              Menu Items
            </h1>
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200"
                  style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                />
                {searchTerm && (
                  <XMarkIcon
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 h-5 w-5 cursor-pointer hover:text-[var(--text-secondary)]"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === ''
                      ? 'bg-[var(--primary-color)] text-[var(--sidebar-text)]'
                      : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)]'
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
                        ? 'bg-[var(--primary-color)] text-[var(--sidebar-text)]'
                        : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-hover)]'
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
                    className="rounded-lg p-2 flex flex-col items-center cursor-pointer border hover:border-2 hover:shadow-md transition-all duration-200"
                    style={{ minHeight: '90px', minWidth: '120px', borderColor: '#4a4a4a', backgroundColor: 'var(--cardBackground)' }}
                  >
                    <img
                      src={product.pictureUrl || 'https://via.placeholder.com/96'}
                      alt={product.name}
                      className="w-14 h-14 object-cover rounded-md mb-1"
                    />
                    {product.time_required && (
                      <span className="absolute top-0.5 right-0.5 text-[7px] px-1 py-0.5 rounded border font-medium leading-none"
                            style={{ color: 'var(--info-color)', backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-color)' }}>
                        {product.time_required}m
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-center leading-tight px-1" style={{ color: 'var(--cardText)' }}>{product.name}</span>
                    <span className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--success-color)' }}>${product.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderMenu;