import { useState, useEffect } from 'react';
import { TrashIcon, PencilIcon, PlusCircleIcon, ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../services/ProductService';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  displayPrice: string;
}

interface ProductsProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  categories: Category[];
  setFormMode: (mode: 'add' | 'edit' | null, product?: Product) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  isFormActive: boolean;
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
}: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridErrorMessage, setGridErrorMessage] = useState<string | null>(null);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteProductName, setDeleteProductName] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formMode, setLocalFormMode] = useState<'add' | 'edit' | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPicture, setNewProductPicture] = useState<File | null>(null);
  const [newProductPicturePreview, setNewProductPicturePreview] = useState<string | undefined>(undefined);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductPicture, setEditProductPicture] = useState<File | null>(null);
  const [editProductPicturePreview, setEditProductPicturePreview] = useState<string | undefined>(undefined);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setGridErrorMessage(null);
        const productList = await fetchProducts(token, logout, categories, filterCategory !== 'all' ? filterCategory : undefined);
        setProducts(productList);
        setGridErrorMessage(productList.length === 0 && filterCategory !== 'all' ? 'No products exist for this category' : null);
      } catch (err) {
        setGridErrorMessage(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, token, logout, categories, filterCategory]);

  useEffect(() => {
    const totalProductPages = Math.ceil(products.length / itemsPerPage);
    if (currentProductPage > totalProductPages && totalProductPages > 0) {
      setCurrentProductPage(totalProductPages);
    } else if (products.length === 0) {
      setCurrentProductPage(1);
    }
  }, [products, currentProductPage]);

  useEffect(() => {
    if (!isFormActive) resetForm();
  }, [isFormActive]);

  useEffect(() => {
    return () => {
      if (newProductPicturePreview) URL.revokeObjectURL(newProductPicturePreview);
      if (editProductPicturePreview) URL.revokeObjectURL(editProductPicturePreview);
    };
  }, [newProductPicturePreview, editProductPicturePreview]);

  const handleFilterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to filter products');
      return;
    }
    setFilterCategory(e.target.value);
    setCurrentProductPage(1);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setDeleteProductId(id);
    setDeleteProductName(name);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!isAuthenticated || !token || !deleteProductId) {
      toast.error('Please log in to delete');
      return;
    }

    try {
      setGridErrorMessage(null);
      await deleteProduct(token, logout, deleteProductId);
      setProducts(products.filter((prod) => prod._id !== deleteProductId));
      toast.success('Product deleted successfully');
    } catch (err) {
      setGridErrorMessage(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteProductId(null);
      setDeleteProductName('');
    }
  };

  const showProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token) {
      toast.error('Please log in to add a product');
      return;
    }
    if (!newProductName.trim() || !newProductPrice.trim() || !newProductCategory || !newProductDesc.trim() || !newProductPicture) {
      toast.error('All fields, including an image, are required');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Price must be a valid positive number');
      return;
    }

    try {
      setFormErrorMessage(null);
      const formData = new FormData();
      formData.append('name', newProductName);
      formData.append('price', newProductPrice);
      formData.append('category_id', newProductCategory);
      formData.append('description', newProductDesc);
      formData.append('picture', newProductPicture);

      const newProduct = await addProduct(token, logout, categories, formData);
      setProducts([...products, newProduct]);
      resetForm();
      toast.success('Product added successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add product';
      setFormErrorMessage(message);
      toast.error(message);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product._id);
    setEditProductName(product.name);
    setEditProductPrice(product.price.toString());
    setEditProductCategory(product.category_id);
    setEditProductDesc(product.description);
    setEditProductPicture(null);
    setEditProductPicturePreview(product.pictureUrl || undefined);
    setLocalFormMode('edit');
    setFormMode('edit', product);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !token || !editingProductId) {
      toast.error('Please log in to update a product');
      return;
    }
    if (!editProductName.trim() || !editProductPrice.trim() || !editProductCategory || !editProductDesc.trim()) {
      toast.error('All fields are required');
      return;
    }
    const priceNum = parseFloat(editProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Price must be a valid positive number');
      return;
    }

    try {
      setFormErrorMessage(null);
      const formData = new FormData();
      formData.append('id', editingProductId);
      formData.append('name', editProductName);
      formData.append('price', editProductPrice);
      formData.append('category_id', editProductCategory);
      formData.append('description', editProductDesc);
      if (editProductPicture) formData.append('picture', editProductPicture);

      const updatedProduct = await updateProduct(token, logout, categories, formData);
      setProducts(products.map((prod) => (prod._id === editingProductId ? updatedProduct : prod)));
      resetForm();
      toast.success('Product updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      setFormErrorMessage(message);
      toast.error(message);
    }
  };

  const resetForm = () => {
    setLocalFormMode(null);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductCategory('');
    setNewProductDesc('');
    if (newProductPicturePreview) URL.revokeObjectURL(newProductPicturePreview);
    setNewProductPicture(null);
    setNewProductPicturePreview(undefined);
    setEditingProductId(null);
    setEditProductName('');
    setEditProductPrice('');
    setEditProductCategory('');
    setEditProductDesc('');
    if (editProductPicturePreview) URL.revokeObjectURL(editProductPicturePreview);
    setEditProductPicture(null);
    setEditProductPicturePreview(undefined);
    setFormErrorMessage(null);
    setGridErrorMessage(null);
    setFormMode(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (isEdit) {
        if (editProductPicturePreview) URL.revokeObjectURL(editProductPicturePreview);
        setEditProductPicture(file);
        setEditProductPicturePreview(previewUrl);
      } else {
        if (newProductPicturePreview) URL.revokeObjectURL(newProductPicturePreview);
        setNewProductPicture(file);
        setNewProductPicturePreview(previewUrl);
      }
    } else {
      if (isEdit) {
        if (editProductPicturePreview) URL.revokeObjectURL(editProductPicturePreview);
        setEditProductPicture(null);
        setEditProductPicturePreview(undefined);
      } else {
        if (newProductPicturePreview) URL.revokeObjectURL(newProductPicturePreview);
        setNewProductPicture(null);
        setNewProductPicturePreview(undefined);
      }
    }
  };

  const indexOfLastProduct = currentProductPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalProductPages = Math.ceil(products.length / itemsPerPage);

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
    <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 h-full relative">
      <div className="absolute inset-0 z-10 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ display: formMode ? 'block' : 'none' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {formMode === 'add' ? 'Add Product' : 'Edit Product'}
          </h3>
          <button onClick={resetForm} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={formMode === 'add' ? handleAddProduct : handleSaveEditProduct} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
            <input
              type="text"
              value={formMode === 'edit' ? editProductName : newProductName}
              onChange={(e) => (formMode === 'edit' ? setEditProductName(e.target.value) : setNewProductName(e.target.value))}
              placeholder="Enter product name"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
            <input
              type="number"
              value={formMode === 'edit' ? editProductPrice : newProductPrice}
              onChange={(e) => (formMode === 'edit' ? setEditProductPrice(e.target.value) : setNewProductPrice(e.target.value))}
              placeholder="Price"
              className="input-field"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={formMode === 'edit' ? editProductCategory : newProductCategory}
              onChange={(e) => (formMode === 'edit' ? setEditProductCategory(e.target.value) : setNewProductCategory(e.target.value))}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={formMode === 'edit' ? editProductDesc : newProductDesc}
              onChange={(e) => (formMode === 'edit' ? setEditProductDesc(e.target.value) : setNewProductDesc(e.target.value))}
              placeholder="Enter product description"
              className="input-field"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Image</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                onChange={(e) => handleImageChange(e, formMode === 'edit')}
                className="hidden"
                id="imageUpload"
                accept="image/jpeg,image/png,image/webp"
                required={formMode === 'add'}
              />
              <label
                htmlFor="imageUpload"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer flex items-center"
              >
                <PlusCircleIcon className="w-4 h-4 mr-1" />
                <span>Upload</span>
              </label>
              {(formMode === 'edit' && editProductPicturePreview) || (formMode === 'add' && newProductPicturePreview) ? (
                <img
                  src={formMode === 'edit' ? editProductPicturePreview : newProductPicturePreview}
                  alt="Preview"
                  className="h-16 w-auto rounded"
                />
              ) : (
                <span className="text-sm text-gray-600 dark:text-gray-300">No image selected</span>
              )}
            </div>
          </div>
          {formErrorMessage && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center">{formErrorMessage}</div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              {formMode === 'edit' ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
      <div className="relative z-0" style={{ opacity: formMode ? 0.5 : 1, pointerEvents: formMode ? 'none' : 'auto' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-2 rounded-lg mr-2">
              Products
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{products.length} items</span>
          </h2>
          <button
            onClick={() => { setLocalFormMode('add'); setFormMode('add'); }}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusCircleIcon className="w-4 h-4 mr-1" />
            <span className="text-sm">Add Product</span>
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={handleFilterChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </div>
        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {currentProducts.map((product) => (
              <div
                key={`product-${product._id}`}

                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-32 cursor-pointer" onClick={() => showProductDetails(product)} >
                  {product.pictureUrl ? (
                    <img
                      src={product.pictureUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text-No+Image'; }}
                    />
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400 text-gray-200 dark:text-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="text-md font-semibold text-gray-dark:text-white truncate">{product.name}</h3>
                  <div className="flex items-center mt-2 justify-between">
                    <p className="text-blue-400 dark:text-blue-600 font-medium text-sm">{product.displayPrice}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{product.categoryName}</p>
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id, product.name)}
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{gridErrorMessage || 'No products available'}</div>
        )}
        {gridErrorMessage && currentProducts.length > 0 && (
          <div className="mt-4 text-red-500 dark:text-red-400 text-center text-sm">{gridErrorMessage}</div>
        )}
        {totalProductPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-4">
            <button
              onClick={() => setCurrentProductPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentProductPage === 1}
              className={`flex items-center px-3 py-1 rounded-lg ${
                currentProductPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-300">Page {currentProductPage} of {totalProductPages}</span>
            <button
              onClick={() => setCurrentProductPage((prev) => Math.min(prev + 1, totalProductPages))}
              disabled={currentProductPage === totalProductPages}
              className={`flex items-center px-3 py-1 rounded-lg ${
                currentProductPage === totalProductPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              Next
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
      {isDeleteModalOpen && deleteProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteProductId(null);
                  setDeleteProductName('');
                  setGridErrorMessage(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to delete the product "{deleteProductName}"?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteProductId(null);
                    setDeleteProductName('');
                    setGridErrorMessage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isDetailModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Details</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                {selectedProduct.pictureUrl ? (
                  <img
                    src={selectedProduct.pictureUrl}
                    alt={selectedProduct.name}
                    className="w-full h-48 object-contain rounded-lg"
                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/150?text-No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg">
                    <span className="text-gray-500 dark:text-gray-400">No Image Available</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedProduct.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h4>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{selectedProduct.displayPrice}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h4>
                  <p className="text-lg text-gray-900 dark:text-white">{selectedProduct.categoryName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedProduct.description || 'No description provided'}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
