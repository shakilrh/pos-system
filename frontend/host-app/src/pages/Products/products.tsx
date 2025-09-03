import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ProductList from './productList';
import ProductDetails from './productDetails';
import ProductCrud from './productCrud';
import { fetchProducts } from '../../services/productService';
import { Category, Product } from './productTypes';
import FlashMessage from '../FlashMessage';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

interface ProductsProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setFormMode: (mode: 'add' | 'edit' | null, product?: Product) => void;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  isFormActive: boolean;
  isCategoryFormActive: boolean;
}

export default function Products({
                                   token,
                                   isAuthenticated,
                                   logout,
                                   categories,
                                   setFormMode,
                                   filterCategory,
                                   setFilterCategory,
                                   isFormActive,
                                   isCategoryFormActive,
                                 }: ProductsProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'add' | 'edit' | 'details' | 'delete'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setFlashMessage(null);
      try {
        const productList = await fetchProducts(token, logout, categories, 'all');
        setAllProducts(productList);
      } catch (err) {
        setFlashMessage({
          message: err instanceof Error ? err.message : 'Failed to fetch products',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, token, logout, categories]);

  useEffect(() => {
    let filtered = allProducts;
    if (filterCategory === 'inactive') {
      filtered = allProducts.filter((product) => !product.isActive);
    } else if (filterCategory && filterCategory !== 'all') {
      filtered = allProducts.filter((product) => product.category_id === filterCategory && product.isActive);
    } else {
      filtered = allProducts.filter((product) => product.isActive);
    }
    setFilteredProducts(filtered);
  }, [allProducts, filterCategory]);

  const handleFilterChange = async (value: string) => {
    setFilterCategory(value === 'all' ? null : value);
  };

  const handleToggleActive = async (product: Product) => {
    if (!isAuthenticated || !token) {
      setFlashMessage({ message: 'Please log in to update product status', type: 'error' });
      return;
    }
    const newStatus = !product.isActive;
    setAllProducts((prev) =>
      prev.map((prod) => (prod._id === product._id ? { ...prod, isActive: newStatus } : prod))
    );
    try {
      const response = await fetch(`${API_BASE_URL}/products/api/v1/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: product._id, status: newStatus ? 'active' : 'deactive' }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update product status');
      }
      setAllProducts((prev) =>
        prev.map((prod) =>
          prod._id === product._id
            ? { ...prod, isActive: newStatus, updatedAt: data.data.data.updatedAt }
            : prod
        )
      );
      setFlashMessage({ message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`, type: 'success' });
    } catch (err) {
      setAllProducts((prev) =>
        prev.map((prod) => (prod._id === product._id ? { ...prod, isActive: !newStatus } : prod))
      );
      setFlashMessage({ message: err instanceof Error ? err.message : 'Failed to update product status', type: 'error' });
    }
  };

  const handleAddProduct = () => {
    setActiveSection('add');
    setFormMode('add');
  };

  const resetForm = () => {
    setActiveSection('list');
    setSelectedProduct(null);
    setEditingProductId(null);
    setDeleteProductId(null);
    setFormMode(null);
  };

  // Determine if list should be visible
  const shouldShowList = activeSection === 'list' || activeSection === 'details' || activeSection === 'delete';

  if (loading) {
    return (
         <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 rounded" style={{ backgroundColor: 'var(--background-secondary)' }}></div>
          {Array(4)
            .fill(0)
            .map((_, idx) => (
              <div key={idx} className="h-40 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}></div>
            ))}
        </div>
      </div>
    );
  }

  return (
      <div className="relative p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)', opacity: isCategoryFormActive ? 0.5 : 1, pointerEvents: isCategoryFormActive ? 'none' : 'auto' }}>
      <Toaster position="top-right" />
      {flashMessage && (
        <FlashMessage
          message={flashMessage.message}
          type={flashMessage.type}
          onClose={() => setFlashMessage(null)}
        />
      )}

      {/* Header - Always visible
      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center mb-4">
          <button className="mr-2" style={{ color: 'var(--text-secondary)' }}>
            <ShoppingBagIcon className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Product Management</h3>
        </div>
      </div>*/}

      {/* Product List - Visible for list, details, and delete states */}
      {shouldShowList && (
        <ProductList
          token={token}
          isAuthenticated={isAuthenticated}
          logout={logout}
          categories={categories}
          filterCategory={filterCategory}
          handleFilterChange={handleFilterChange}
          products={filteredProducts}
          setProducts={setAllProducts}
          isCategoryFormActive={isCategoryFormActive}
          onAdd={handleAddProduct}
          onEdit={(product) => {
            setSelectedProduct(product);
            setEditingProductId(product._id);
            setActiveSection('edit');
            setFormMode('edit', product);
          }}
          onDelete={(id) => {
            setDeleteProductId(id);
            setSelectedProduct(allProducts.find((p) => p._id === id) || null);
            setActiveSection('delete');
          }}
          onViewDetails={(product) => {
            setSelectedProduct(product);
            setActiveSection('details');
          }}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Add Form - Replaces list */}
      {activeSection === 'add' && (
        <ProductCrud
          token={token}
          logout={logout}
          categories={categories}
          setProducts={setAllProducts}
          products={allProducts}
          onCancel={resetForm}
          isCategoryFormActive={isCategoryFormActive}
          mode="add"
          setFlashMessageInParent={setFlashMessage}
        />
      )}

      {/* Edit Form - Replaces list */}
      {activeSection === 'edit' && selectedProduct && editingProductId && (
        <ProductCrud
          token={token}
          logout={logout}
          categories={categories}
          product={selectedProduct}
          setProducts={setAllProducts}
          products={allProducts}
          editingProductId={editingProductId}
          onCancel={resetForm}
          isCategoryFormActive={isCategoryFormActive}
          mode="edit"
          setFlashMessageInParent={setFlashMessage}
        />
      )}

      {/* Details Modal - Overlays on list */}
      {activeSection === 'details' && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--background-color)' }}>
            <ProductDetails product={selectedProduct} onCancel={resetForm} />
          </div>
        </div>
      )}

      {/* Delete Modal - Overlays on list */}
        {activeSection === 'delete' && deleteProductId && selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-md" style={{ backgroundColor: 'var(--background-color)' } as React.CSSProperties}>
                <ProductCrud
                    token={token}
                    logout={logout}
                    categories={categories}
                    product={selectedProduct}
                    deleteProductId={deleteProductId}
                    setProducts={setAllProducts}
                    products={allProducts}
                    onCancel={resetForm}
                    isCategoryFormActive={isCategoryFormActive}
                    mode="delete"
                    setFlashMessageInParent={setFlashMessage}
                />
              </div>
            </div>
        )}
    </div>
  );
}
