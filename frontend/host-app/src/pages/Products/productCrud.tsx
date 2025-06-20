import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import { Toaster } from 'react-hot-toast';
import { addProduct, updateProduct, deleteProduct } from '../../services/productService';
import { Category, Product } from './productTypes';

interface ProductCrudProps {
  token: string | null;
  logout: () => void;
  categories: Category[];
  product?: Product;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  products: Product[];
  editingProductId?: string | null;
  deleteProductId?: string | null;
  setGridErrorMessage?: React.Dispatch<React.SetStateAction<string | null>>;
  onCancel: () => void;
  isCategoryFormActive: boolean;
  mode: 'add' | 'edit' | 'delete';
}

export default function ProductCrud({
                                      token,
                                      logout,
                                      categories,
                                      product,
                                      setProducts,
                                      products,
                                      editingProductId,
                                      deleteProductId,
                                      setGridErrorMessage,
                                      onCancel,
                                      isCategoryFormActive,
                                      mode,
                                    }: ProductCrudProps) {
  const [newProductName, setNewProductName] = useState(product?.name || '');
  const [newProductPrice, setNewProductPrice] = useState(product?.price.toString() || '');
  const [newProductCategory, setNewProductCategory] = useState(product?.category_id || '');
  const [newProductDesc, setNewProductDesc] = useState(product?.description || '');
  const [newProductPicture, setNewProductPicture] = useState<File | null>(null);
  const [newProductPicturePreview, setNewProductPicturePreview] = useState<string | undefined>(product?.pictureUrl || undefined);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (newProductPicturePreview) URL.revokeObjectURL(newProductPicturePreview);
    };
  }, [newProductPicturePreview]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (newProductPicturePreview) URL.revokeObjectURL(newProductPicturePreview);
      setNewProductPicture(file);
      setNewProductPicturePreview(previewUrl);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice.trim() || !newProductCategory || !newProductDesc.trim() || !newProductPicture) {
      setFormErrorMessage('All fields, including an image, are required');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormErrorMessage('Price must be a valid positive number');
      return;
    }
    const formData = new FormData();
    formData.append('name', newProductName);
    formData.append('price', newProductPrice);
    formData.append('category_id', newProductCategory);
    formData.append('description', newProductDesc);
    formData.append('picture', newProductPicture);
    try {
      const newProduct = await addProduct(token, logout, categories, formData);
      setProducts([...products, newProduct].filter((p) => p.isActive));
      onCancel();
    } catch (err) {
      setFormErrorMessage(err instanceof Error ? err.message : 'Failed to add product');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice.trim() || !newProductCategory || !newProductDesc.trim()) {
      setFormErrorMessage('All fields are required');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormErrorMessage('Price must be a valid positive number');
      return;
    }
    const formData = new FormData();
    formData.append('id', editingProductId!);
    formData.append('name', newProductName);
    formData.append('price', newProductPrice);
    formData.append('category_id', newProductCategory);
    formData.append('description', newProductDesc);
    if (newProductPicture) formData.append('picture', newProductPicture);
    try {
      const updatedProduct = await updateProduct(token, logout, categories, formData);
      setProducts(products.map((prod) => (prod._id === editingProductId ? updatedProduct : prod)).filter((p) => p.isActive));
      onCancel();
    } catch (err) {
      setFormErrorMessage(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;
    try {
      await deleteProduct(token, logout, deleteProductId);
      setProducts(products.filter((prod) => prod._id !== deleteProductId));
      if (setGridErrorMessage) setGridErrorMessage(null);
      onCancel();
    } catch (err) {
      if (setGridErrorMessage) setGridErrorMessage(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  if (mode === 'add') {
    return (
      <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
        <Toaster position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Product</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              id="productName"
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Enter product name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
            <input
              id="productPrice"
              type="number"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              placeholder="Price"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              id="productCategory"
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isCategoryFormActive}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="productDescription"
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              placeholder="Product description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              required
            />
          </div>
          <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Image</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
                accept="image/jpeg,image/png,image/webp"
                required
                disabled={isCategoryFormActive}
              />
              <label
                htmlFor="imageUpload"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                style={{ pointerEvents: isCategoryFormActive ? 'none' : 'auto', opacity: isCategoryFormActive ? 0.5 : 1 }}
              >
                <PlusCircleIcon className="w-4 h-4" />
                <span>Upload</span>
              </label>
              {newProductPicturePreview ? (
                <img src={newProductPicturePreview} alt="Preview" className="h-16 w-auto rounded" />
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-300">No image selected</span>
              )}
            </div>
          </div>
          {formErrorMessage && <div className="text-red-500 dark:text-red-400 text-sm text-center">{formErrorMessage}</div>}
          <div className="flex justify-end gap-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              disabled={isCategoryFormActive}
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto">
        <Toaster position="top-right" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Product</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              id="productName"
              type="text"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              placeholder="Enter product name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
            <input
              id="productPrice"
              type="number"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              placeholder="Price"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              step="0.01"
              required
            />
          </div>
          <div>
            <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              id="productCategory"
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isCategoryFormActive}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="productDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              id="productDescription"
              value={newProductDesc}
              onChange={(e) => setNewProductDesc(e.target.value)}
              placeholder="Product description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              required
            />
          </div>
          <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Image</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                onChange={handleImageChange}
                className="hidden"
                id="imageUpload"
                accept="image/jpeg,image/png,image/webp"
                disabled={isCategoryFormActive}
              />
              <label
                htmlFor="imageUpload"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer flex items-center gap-1"
                style={{ pointerEvents: isCategoryFormActive ? 'none' : 'auto', opacity: isCategoryFormActive ? 0.5 : 1 }}
              >
                <PlusCircleIcon className="w-4 h-4" />
                <span>Upload</span>
              </label>
              {newProductPicturePreview ? (
                <img src={newProductPicturePreview} alt="Preview" className="h-16 w-auto rounded" />
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-300">No image selected</span>
              )}
            </div>
          </div>
          {formErrorMessage && <div className="text-red-500 dark:text-red-400 text-sm text-center">{formErrorMessage}</div>}
          <div className="flex justify-end gap-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              disabled={isCategoryFormActive}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Are you sure you want to delete the product "{product?.name}"?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
