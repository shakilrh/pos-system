import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusCircleIcon, ExclamationCircleIcon, ShoppingBagIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { addProduct, updateProduct, deleteProduct } from '../../services/productService';
import { Category, Product } from './productTypes';
import FlashMessage from '../FlashMessage';

interface ProductCrudProps {
  token: string | null;
  logout: () => void;
  categories: Category[];
  product?: Product | null;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  products: Product[];
  editingProductId?: string | null;
  deleteProductId?: string | null;
  setGridErrorMessage?: React.Dispatch<React.SetStateAction<string | null>>;
  onCancel: () => void;
  isCategoryFormActive: boolean;
  mode: 'add' | 'edit' | 'delete';
  setFlashMessageInParent?: (message: { message: string; type: 'success' | 'error' }) => void;
  currentCurrency?: string;
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
                                      setFlashMessageInParent,
                                      currentCurrency: propCurrency = 'pkr',
                                    }: ProductCrudProps) {
  const [newProductName, setNewProductName] = useState(product?.name || '');
  const [newProductPrice, setNewProductPrice] = useState(product?.price.toString() || '');
  const [newProductCategory, setNewProductCategory] = useState(product?.category_id || '');
  const [newProductDesc, setNewProductDesc] = useState(product?.description || '');
  const [newProductPicture, setNewProductPicture] = useState<File | null>(null);
  const [newProductPicturePreview, setNewProductPicturePreview] = useState<string | null>(product?.pictureUrl || null);
  const [newProductTimeRequired, setNewProductTimeRequired] = useState(product?.time_required?.toString() || '');
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [imageError, setImageError] = useState(false);

  // Add loading state similar to roleCrud
  const [isLoading, setIsLoading] = useState({
    create: false,
    update: false,
    delete: false
  });

  const [errors, setErrors] = useState<{
    name?: string[];
    price?: string[];
    category?: string[];
    description?: string[];
    picture?: string[];
    timeRequired?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [activeCurrency, setActiveCurrency] = useState(propCurrency);

  // Function to get currency symbol based on current currency
  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      pkr: '₨',
      dollar: '$',
      euro: '€'
    };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  // Function to get current currency from various sources
  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || propCurrency || storedCurrency || 'pkr';
  };

  // Update currency when prop changes
  useEffect(() => {
    setActiveCurrency(propCurrency);
  }, [propCurrency]);

  // Listen for currency changes from the app
  useEffect(() => {
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

  useEffect(() => {
    setNewProductName(product?.name || '');
    setNewProductPrice(product?.price.toString() || '');
    setNewProductCategory(product?.category_id || '');
    setNewProductDesc(product?.description || '');
    setNewProductPicture(null);
    setNewProductPicturePreview(product?.pictureUrl || null);
    setNewProductTimeRequired(product?.time_required?.toString() || '');
    setImageError(false);
    setErrors({});
    setTouchedFields(new Set());
  }, [product]);

  useEffect(() => {
    return () => {
      if (newProductPicturePreview && newProductPicture) {
        URL.revokeObjectURL(newProductPicturePreview);
      }
    };
  }, [newProductPicturePreview, newProductPicture]);

  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Product name is required');
    } else {
      if (name.length < 2) errors.push('Product name must be at least 2 characters long');
      if (name.length > 100) errors.push('Product name must be less than 100 characters');
      if (!/^[A-Za-z0-9\s&'-.,()]+$/.test(name)) {
        errors.push('Product name can only contain letters, numbers, spaces, and common punctuation');
      }
      if (/^\s|\s$/.test(name)) errors.push('Product name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Product name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validatePrice = (price: string): string[] => {
    const errors: string[] = [];
    if (!price.trim()) {
      errors.push('Price is required');
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) errors.push('Price must be a valid number');
      if (priceNum < 0) errors.push('Price cannot be negative');
      if (priceNum > 10000) errors.push('Price cannot exceed 10000');
      if (!/^\d+(\.\d{1,2})?$/.test(price)) errors.push('Price must have at most 2 decimal places');
    }
    return errors;
  };

  const validateCategory = (category: string): string[] => {
    const errors: string[] = [];
    if (!category.trim()) errors.push('Category is required');
    return errors;
  };

  const validateDescription = (description: string): string[] => {
    const errors: string[] = [];
    if (description && description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    return errors;
  };

  const validatePicture = (file: File | null): string[] => {
    if (!file) return [];
    const errors: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Image must be JPEG, PNG, or WebP');
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) errors.push('Image size must be less than 5MB');
    const minSize = 1024;
    if (file.size < minSize) errors.push('Image file is too small (minimum 1KB)');
    return errors;
  };

  const validateTimeRequired = (time: string): string[] => {
    const errors: string[] = [];
    if (!time.trim()) {
      errors.push('Preparation time is required');
    } else {
      const timeNum = parseInt(time);
      if (isNaN(timeNum)) errors.push('Preparation time must be a valid number');
      if (timeNum < 0) errors.push('Preparation time cannot be negative');
      if (timeNum > 1440) errors.push('Preparation time cannot exceed 1440 minutes (24 hours)');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'name': return validateName(newProductName);
      case 'price': return validatePrice(newProductPrice);
      case 'category': return validateCategory(newProductCategory);
      case 'description': return validateDescription(newProductDesc);
      case 'picture': return validatePicture(newProductPicture);
      case 'timeRequired': return validateTimeRequired(newProductTimeRequired);
      default: return [];
    }
  };

  const isFormValid = (): boolean => {
    const requiredFields = ['name', 'price', 'category', 'timeRequired'];
    const requiredFieldsValid = requiredFields.every(field => getFieldErrors(field).length === 0);
    const optionalFieldsValid = ['picture', 'description'].every(field => getFieldErrors(field).length === 0);
    return requiredFieldsValid && optionalFieldsValid;
  };

  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName === 'name') setNewProductName(value);
    if (fieldName === 'price') setNewProductPrice(value);
    if (fieldName === 'category') setNewProductCategory(value);
    if (fieldName === 'description') setNewProductDesc(value);
    if (fieldName === 'timeRequired') setNewProductTimeRequired(value);

    if (touchedFields.has(fieldName)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewProductPicture(file);
    setImageError(false);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      if (newProductPicturePreview && newProductPicture) {
        URL.revokeObjectURL(newProductPicturePreview);
      }
      setNewProductPicturePreview(previewUrl);
    } else {
      setNewProductPicturePreview(null);
    }

    const pictureErrors = validatePicture(file);
    setErrors(prev => ({ ...prev, picture: pictureErrors }));
    if (pictureErrors.length > 0) {
      setFlashMessage({ message: pictureErrors[0], type: 'error' });
    } else if (flashMessage?.type === 'error' && flashMessage.message.includes('Image')) {
      setFlashMessage(null);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName)
    }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0) return null;
    return (
        <div className="mt-1 space-y-1">
          {fieldErrors.map((error, index) => (
              <p key={index} className="text-xs flex items-start" style={{ color: 'var(--error-color)' }}>
                <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
          ))}
        </div>
    );
  };

  // Component to render image or placeholder
  const ImagePreview = () => {
    const hasValidImage = newProductPicturePreview && !imageError;

    if (hasValidImage) {
      return (
          <img
              src={newProductPicturePreview!}
              alt={newProductName || 'Product'}
              className="h-16 w-16 object-cover rounded border"
              style={{ borderColor: 'var(--border-color)' }}
              onError={handleImageError}
          />
      );
    }

    return (
        <div
            className="h-16 w-16 rounded border flex items-center justify-center"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--background-secondary)'
            }}
        >
          <PhotoIcon
              className="w-8 h-8"
              style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
    );
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['name', 'price', 'category', 'description', 'picture', 'timeRequired'];
    setTouchedFields(new Set(allFields));
    const allErrors: any = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });
    setErrors(allErrors);
    if (Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0)) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: 'Please fix all errors before submitting', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
      return;
    }

    if (!token) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: 'Please log in to add a product', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
      return;
    }

    setIsLoading(prev => ({ ...prev, create: true }));
    try {
      const formData = new FormData();
      if (newProductName) formData.append('name', newProductName);
      if (newProductPrice) formData.append('price', newProductPrice);
      if (newProductCategory) formData.append('category_id', newProductCategory);
      if (newProductDesc) formData.append('description', newProductDesc);
      if (newProductPicture) formData.append('picture', newProductPicture);
      if (newProductTimeRequired) formData.append('time_required', newProductTimeRequired);

      const newProduct = await addProduct(token, logout, categories, formData);
      setProducts((prev) => [...prev, newProduct]);
      const successMessage: { message: string; type: 'success' | 'error' } = { message: `Product "${newProductName || 'new product'}" added successfully!`, type: 'success' };
      setFlashMessageInParent?.(successMessage);
      onCancel();
    } catch (err) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: err instanceof Error ? err.message : 'Failed to add product', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = ['name', 'price', 'category', 'description', 'picture', 'timeRequired'];
    setTouchedFields(new Set(allFields));
    const allErrors: any = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });
    setErrors(allErrors);
    if (Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0)) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: 'Please fix all errors before submitting', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
      return;
    }

    if (!token || !editingProductId) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: 'Please log in to update a product', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
      return;
    }

    setIsLoading(prev => ({ ...prev, update: true }));
    try {
      const formData = new FormData();
      formData.append('id', editingProductId);
      if (newProductName) formData.append('name', newProductName);
      if (newProductPrice) formData.append('price', newProductPrice);
      if (newProductCategory) formData.append('category_id', newProductCategory);
      if (newProductDesc) formData.append('description', newProductDesc);
      if (newProductPicture) formData.append('picture', newProductPicture);
      if (newProductTimeRequired) formData.append('time_required', newProductTimeRequired);

      const updatedProduct = await updateProduct(token, logout, categories, formData);
      setProducts((prev) => prev.map((prod) => (prod._id === editingProductId ? updatedProduct : prod)));
      const successMessage: { message: string; type: 'success' | 'error' } = { message: `Product "${newProductName || 'updated product'}" updated successfully!`, type: 'success' };
      setFlashMessageInParent?.(successMessage);
      onCancel();
    } catch (err) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: err instanceof Error ? err.message : 'Failed to update product', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!token || !deleteProductId) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: 'Please log in to delete a product', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
      return;
    }

    setIsLoading(prev => ({ ...prev, delete: true }));
    try {
      await deleteProduct(token, logout, deleteProductId);
      setProducts((prev) => prev.filter((prod) => prod._id !== deleteProductId));
      const successMessage: { message: string; type: 'success' | 'error' } = { message: `Product "${product?.name || 'product'}" deleted successfully!`, type: 'success' };
      setFlashMessageInParent?.(successMessage);
      setGridErrorMessage?.(null);
      setFlashMessage(null);
      onCancel();
    } catch (err) {
      const errorMessage: { message: string; type: 'success' | 'error' } = { message: err instanceof Error ? err.message : 'Failed to delete product', type: 'error' };
      setFlashMessage(errorMessage);
      setFlashMessageInParent?.(errorMessage);
      setGridErrorMessage?.(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setIsLoading(prev => ({ ...prev, delete: false }));
    }
  };

  if (mode === 'add' || mode === 'edit') {
    return (
        <div className="rounded-lg" style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="p-4 border-b flex justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center space-x-2">
              <ShoppingBagIcon className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                {mode === 'edit' ? 'Edit Product' : 'Create New Product'}
              </h3>
            </div>
            <button onClick={onCancel} className="hover:text-[var(--text-secondary)]" style={{ color: 'var(--text-secondary)' }}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={mode === 'edit' ? handleEditSubmit : handleAddSubmit} className="p-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="productName" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Product Name *
                </label>
                <input
                    id="productName"
                    type="text"
                    value={newProductName}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur('name')}
                    placeholder="Enter product name"
                    className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.name && errors.name.length > 0 ? 'ring-1' : ''}`}
                    style={{
                      borderColor: errors.name && errors.name.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)',
                      outlineColor: 'var(--focus-ring)',
                    }}
                    maxLength={100}
                    required
                />
                {renderFieldErrors('name')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{newProductName.length}/100</p>
              </div>
              <div>
                <label htmlFor="productPrice" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Price ({getCurrencySymbol(activeCurrency)}) *
                </label>
                <input
                    id="productPrice"
                    type="number"
                    value={newProductPrice}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    onFocus={() => handleFocus('price')}
                    onBlur={() => handleBlur('price')}
                    placeholder="Price"
                    className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.price && errors.price.length > 0 ? 'ring-1' : ''}`}
                    style={{
                      borderColor: errors.price && errors.price.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)',
                      outlineColor: 'var(--focus-ring)',
                    }}
                    step="0.01"
                    required
                />
                {renderFieldErrors('price')}
              </div>
              <div>
                <label htmlFor="productTimeRequired" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Preparation Time (minutes) *
                </label>
                <input
                    id="productTimeRequired"
                    type="number"
                    value={newProductTimeRequired}
                    onChange={(e) => handleInputChange('timeRequired', e.target.value)}
                    onFocus={() => handleFocus('timeRequired')}
                    onBlur={() => handleBlur('timeRequired')}
                    placeholder="Time required in minutes"
                    className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.timeRequired && errors.timeRequired.length > 0 ? 'ring-1' : ''}`}
                    style={{
                      borderColor: errors.timeRequired && errors.timeRequired.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)',
                      outlineColor: 'var(--focus-ring)',
                    }}
                    step="1"
                    min="0"
                    required
                />
                {renderFieldErrors('timeRequired')}
              </div>
              <div>
                <label htmlFor="productCategory" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Category *
                </label>
                <select
                    id="productCategory"
                    value={newProductCategory}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    onFocus={() => handleFocus('category')}
                    onBlur={() => handleBlur('category')}
                    className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.category && errors.category.length > 0 ? 'ring-1' : ''}`}
                    style={{
                      borderColor: errors.category && errors.category.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)',
                      outlineColor: 'var(--focus-ring)',
                    }}
                    disabled={isCategoryFormActive}
                    required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                {renderFieldErrors('category')}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="productDescription" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Description (Optional)
                </label>
                <textarea
                    id="productDescription"
                    value={newProductDesc}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    onFocus={() => handleFocus('description')}
                    onBlur={() => handleBlur('description')}
                    placeholder="Product description (optional)"
                    className={`w-full p-2 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.description && errors.description.length > 0 ? 'ring-1' : ''}`}
                    style={{
                      borderColor: errors.description && errors.description.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)',
                      outlineColor: 'var(--focus-ring)',
                    }}
                    rows={3}
                    maxLength={500}
                />
                {renderFieldErrors('description')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{newProductDesc.length}/500</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="imageUpload" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Upload Image (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                      type="file"
                      onChange={handleImageChange}
                      className="hidden"
                      id="imageUpload"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isCategoryFormActive || isLoading.create || isLoading.update}
                  />
                  <label
                      htmlFor="imageUpload"
                      className={`cursor-pointer flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none ${isCategoryFormActive || isLoading.create || isLoading.update ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)]'}`}
                      style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                  >
                    <PlusCircleIcon className="w-4 h-4 mr-1" />
                    <span>Upload</span>
                  </label>
                  <ImagePreview />
                </div>
                {renderFieldErrors('picture')}
                {newProductPicture && (!errors.picture || errors.picture.length === 0) && (
                    <p className="mt-1 text-xs flex items-center" style={{ color: 'var(--primary-color)' }}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {newProductPicture.name} ({(newProductPicture.size / 1024).toFixed(1)} KB)
                    </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                  type="button"
                  onClick={onCancel}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isCategoryFormActive || isLoading.create || isLoading.update ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : 'text-[var(--button-inactive-text, var(--text-secondary))] border border-[var(--border-color)] hover:bg-[var(--surface-secondary)]'}`}
                  style={{ backgroundColor: 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                  disabled={isCategoryFormActive || isLoading.create || isLoading.update}
              >
                Cancel
              </button>
              <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 ${isCategoryFormActive || isLoading.create || isLoading.update || !isFormValid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--primary-color)]'}`}
                  style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
                  disabled={isCategoryFormActive || isLoading.create || isLoading.update || !isFormValid()}
              >
                {isLoading.create || isLoading.update ? (
                    <span className="flex items-center justify-center">
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' } as React.CSSProperties}>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
                      {mode === 'edit' ? 'Updating...' : 'Creating...'}
  </span>
                ) : (
                    mode === 'edit' ? 'Update Product' : 'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
    );
  }

  if (mode === 'delete') {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-6 w-full max-w-md mx-4 shadow-xl" style={{ backgroundColor: 'var(--surface-color)' }}>
            <div className="flex items-center space-x-2 mb-4">
              <ExclamationCircleIcon className="w-6 h-6" style={{ color: 'var(--error-color)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Confirm Delete</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the product "{product?.name}"?
            </p>
            <div className="flex space-x-3">
              <button
                  onClick={handleDeleteConfirm}
                  disabled={isLoading.delete}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--error-color)] text-[var(--text-on-primary)] hover:bg-opacity-90'}`}
                  style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
              >
                {isLoading.delete ? (
                    <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
                ) : (
                    'Delete'
                )}
              </button>
              <button
                  onClick={onCancel}
                  disabled={isLoading.delete}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                  style={{ backgroundColor: 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
    );
  }

}