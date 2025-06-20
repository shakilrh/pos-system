import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ProductList from './productList';
import ProductDetails from './productDetails';
import ProductCrud from './productCrud';
import { fetchProducts, addProduct, updateProduct, deleteProduct, updateProductStatus } from '../../services/productService';
import { Category, Product } from './productTypes';

interface ProductsProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setFormMode: (mode: 'add' | 'edit' | null, product?: Product) => void;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void; // Updated to match ProductList expectation
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridErrorMessage, setGridErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'list' | 'add' | 'edit' | 'delete' | 'details'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setGridErrorMessage(null);
        const productList = await fetchProducts(token, logout, categories, filterCategory || 'all');
        let filteredProducts = productList;
        if (filterCategory === 'inactive') {
          filteredProducts = productList.filter((product) => !product.isActive);
        } else if (filterCategory && filterCategory !== 'all') {
          filteredProducts = productList.filter((product) => product.category_id === filterCategory && product.isActive);
        } else {
          filteredProducts = productList.filter((product) => product.isActive);
        }
        setProducts(filteredProducts);
        setGridErrorMessage(filteredProducts.length === 0 ? 'No products found for this filter' : null);
      } catch (err) {
        setGridErrorMessage(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, token, logout, categories, filterCategory]);

  const handleFilterChange = (value: string) => {
    setFilterCategory(value === 'all' ? null : value); // Updated to match original logic
    setCurrentProductPage(1);
  };

  const resetForm = () => {
    setActiveSection('list');
    setSelectedProduct(null);
    setEditingProductId(null);
    setDeleteProductId(null);
    setFormMode(null);
  };

  if (loading) {
    return (
      <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          {Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full relative" style={{ opacity: isCategoryFormActive ? 0.5 : 1 }}>
      <Toaster position="top-right" />
      {activeSection === 'list' && (
        <ProductList
          token={token}
          isAuthenticated={isAuthenticated}
          logout={logout}
          categories={categories}
          filterCategory={filterCategory}
          handleFilterChange={handleFilterChange} // Pass the handler function
          isCategoryFormActive={isCategoryFormActive}
          onAdd={() => { setActiveSection('add'); setFormMode('add'); }}
          onEdit={(product) => { setSelectedProduct(product); setEditingProductId(product._id); setActiveSection('edit'); setFormMode('edit', product); }}
          onDelete={(product) => { setSelectedProduct(product); setDeleteProductId(product._id); setActiveSection('delete'); setFormMode('edit', product); }}
          onView={(product) => { setSelectedProduct(product); setActiveSection('details'); }}
        />
      )}
      {activeSection === 'add' && isFormActive && (
        <ProductCrud
          token={token}
          logout={logout}
          categories={categories}
          setProducts={setProducts}
          products={products}
          onCancel={resetForm}
          isCategoryFormActive={isCategoryFormActive}
          mode="add"
        />
      )}
      {activeSection === 'edit' && selectedProduct && editingProductId && isFormActive && (
        <ProductCrud
          token={token}
          logout={logout}
          categories={categories}
          product={selectedProduct}
          setProducts={setProducts}
          products={products}
          editingProductId={editingProductId}
          onCancel={resetForm}
          isCategoryFormActive={isCategoryFormActive}
          mode="edit"
        />
      )}
      {activeSection === 'delete' && selectedProduct && deleteProductId && isFormActive && (
        <ProductCrud
          token={token}
          logout={logout}
          product={selectedProduct}
          deleteProductId={deleteProductId}
          setProducts={setProducts}
          products={products}
          setGridErrorMessage={setGridErrorMessage}
          onCancel={resetForm}
          isCategoryFormActive={isCategoryFormActive}
          mode="delete"
        />
      )}
      {activeSection === 'details' && selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onCancel={resetForm}
        />
      )}
    </div>
  );
}
