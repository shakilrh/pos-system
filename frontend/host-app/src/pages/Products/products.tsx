import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ProductList from './productList';
import ProductDetails from './productDetails';
import ProductCrud from './productCrud';
import { fetchProducts } from '../../services/productService';
import { Category, Product } from './productTypes';
import FlashMessage from '../FlashMessage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';

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
  const [activeSection, setActiveSection] = useState<'list' | 'add' | 'edit' | 'details'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  const resetForm = () => {
    setActiveSection('list');
    setSelectedProduct(null);
    setEditingProductId(null);
    setIsDeleteModalOpen(false);
    setDeleteProductId(null);
    setFormMode(null);
  };

  if (loading) {
    return (
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          {Array(4)
            .fill(0)
            .map((_, idx) => (
              <div key={idx} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full relative"
      style={{ opacity: isCategoryFormActive ? 0.5 : 1 }}
    >
      <Toaster position="top-right" />

      <div className="h-10 mb-4">
        {flashMessage && (
          <FlashMessage
            message={flashMessage.message}
            type={flashMessage.type}
            onClose={() => setFlashMessage(null)}
          />
        )}
      </div>
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
        onAdd={() => {
          setActiveSection('add');
          setFormMode('add');
        }}
        onEdit={(product) => {
          setSelectedProduct(product);
          setEditingProductId(product._id);
          setActiveSection('edit');
          setFormMode('edit', product);
        }}
        onDelete={(id) => {
          setDeleteProductId(id);
          setIsDeleteModalOpen(true);
        }}
        onViewDetails={(product) => {
          setSelectedProduct(product);
          setActiveSection('details');
        }}
        onToggleActive={handleToggleActive}
      />
      {isFormActive && activeSection === 'add' && (
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
      {isFormActive && activeSection === 'edit' && selectedProduct && editingProductId && (
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
      {activeSection === 'details' && selectedProduct && (
        <ProductDetails product={selectedProduct} onCancel={resetForm} />
      )}
      {isDeleteModalOpen && deleteProductId && (
        <ProductCrud
          token={token}
          logout={logout}
          product={allProducts.find((p) => p._id === deleteProductId) || null}
          deleteProductId={deleteProductId}
          setProducts={setAllProducts}
          products={allProducts}
          onCancel={resetForm}
          isCategoryFormActive={isCategoryFormActive}
          mode="delete"
          setFlashMessageInParent={setFlashMessage}
        />
      )}
    </div>
  );
}
