import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import Sidebar from './Sidebar';

Modal.setAppElement('#root');

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(6);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchFilters, setSearchFilters] = useState({
    keywords: '',
    category: '',
    brand: '',
    status: 'all',
    barcode: '',
  });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    productName: '',
    productDescription: '',
    productSKU: '',
    productBarcode: '',
    purchasedPrice: '',
    sellingPrice: '',
    productQuantity: '',
    category: '',
    brand: '',
    status: 'ACTIVE',
    tags: '',
    lowStockThreshold: '',
    profitMargin: '',
  });
  const [modalTitle, setModalTitle] = useState('Add Product');
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [brandError, setBrandError] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingBrand, setAddingBrand] = useState(false);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showProfitMargin, setShowProfitMargin] = useState(false);
  const categoryInputRef = useRef(null);
  const brandInputRef = useRef(null);
// /*test
  useEffect(() => {
    fetchInventoryData();
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Shift') {
      setShowProfitMargin(true);
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Shift') {
      setShowProfitMargin(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/store/inventory', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setProducts(response.data.products || []);
      setOriginalProducts(response.data.products || []);
      setFilteredProducts(response.data.products || []);
      setCategories(response.data.categories || []);
      setBrands(response.data.brands || []);
      setCategorySuggestions(response.data.categories || []);
      setBrandSuggestions(response.data.brands || []);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data. Please try again later.');
    }
  };

  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters({ ...searchFilters, [name]: value });
    filterProducts({ ...searchFilters, [name]: value });
  };

  const filterProducts = (filters) => {
    let filtered = [...originalProducts];
    if (filters.keywords) {
      const query = filters.keywords.toLowerCase().trim();
      filtered = filtered.filter(product =>
        Object.values(product).some(
          value => value && value.toString().toLowerCase().includes(query)
        )
      );
    }
    if (filters.category) {
      filtered = filtered.filter(product =>
        product.categoryName?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }
    if (filters.brand) {
      filtered = filtered.filter(product =>
        product.brandName?.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter(product =>
        product.status?.toLowerCase() === filters.status
      );
    }
    if (filters.barcode) {
      filtered = filtered.filter(product =>
        product.productBarcode?.toLowerCase().includes(filters.barcode.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    const newDirection = isAsc ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...filteredProducts].sort((a, b) => {
      const valA = a[field] ? a[field].toString().toLowerCase() : '';
      const valB = b[field] ? b[field].toString().toLowerCase() : '';
      if (typeof a[field] === 'number' && typeof b[field] === 'number') {
        return newDirection === 'asc' ? a[field] - b[field] : b[field] - a[field];
      }
      return newDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    setFilteredProducts(sorted);
    setCurrentPage(1);
  };

  const paginate = () => {
    const totalRows = filteredProducts.length;
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, totalRows);
    return filteredProducts.slice(start, end);
  };

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetSearch = () => {
    setSearchFilters({
      keywords: '',
      category: '',
      brand: '',
      status: 'all',
      barcode: '',
    });
    setFilteredProducts([...originalProducts]);
    setCurrentPage(1);
  };

  const openModal = (action, product = null) => {
    setError('');
    setCategoryError('');
    setBrandError('');
    setModalTitle(action === 'edit' ? 'Edit Product' : 'Add Product');
    if (action === 'edit' && product) {
      axios
        .get(`http://localhost:3000/api/store/showProduct/${product.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((response) => {
          const data = response.data;
          setFormData({
            id: data.id,
            productName: data.productName,
            productDescription: data.productDescription,
            productSKU: data.productSKU,
            productBarcode: data.productBarcode,
            purchasedPrice: data.purchasedPrice,
            sellingPrice: data.sellingPrice || '',
            productQuantity: data.productQuantity,
            category: data.categoryName || '',
            brand: data.brandName || '',
            status: data.status || 'ACTIVE',
            tags: data.tags || '',
            lowStockThreshold: data.lowStockThreshold || '',
            profitMargin: data.profitMargin ? `${data.profitMargin}%` : '',
          });
          setModalIsOpen(true);
        })
        .catch((err) => {
          console.error('Error fetching product:', err);
          setError(`Unable to fetch product details: ${err.response?.data?.message || 'An unexpected error occurred'}. Please try again.`);
        });
    } else {
      setFormData({
        id: '',
        productName: '',
        productDescription: '',
        productSKU: '',
        productBarcode: '',
        purchasedPrice: '',
        sellingPrice: '',
        productQuantity: '',
        category: '',
        brand: '',
        status: 'ACTIVE',
        tags: '',
        lowStockThreshold: '',
        profitMargin: '',
      });
      setModalIsOpen(true);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteProductId(id);
    setDeleteModalIsOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      if (name === 'purchasedPrice' || name === 'sellingPrice') {
        const purchasePrice = parseFloat(updatedData.purchasedPrice) || 0;
        const sellingPrice = parseFloat(updatedData.sellingPrice) || 0;
        if (purchasePrice > 0 && sellingPrice > 0) {
          const profitMargin = ((sellingPrice - purchasePrice) / purchasePrice * 100).toFixed(2);
          updatedData.profitMargin = `${profitMargin}%`;
          updatedData.profitMarginValue = profitMargin;
        } else {
          updatedData.profitMargin = '';
          updatedData.profitMarginValue = '';
        }
      }
      return updatedData;
    });
  };

  const handleSearchableInputChange = async (type, value) => {
    setFormData({ ...formData, [type]: value });
    if (value.length >= 1) {
      try {
        const response = await axios.get(`http://localhost:3000/api/store/search${type.charAt(0).toUpperCase() + type.slice(1)}s`, {
          params: { q: value },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (type === 'category') {
          setCategorySuggestions(response.data || []);
          setShowCategorySuggestions(true);
        } else {
          setBrandSuggestions(response.data || []);
          setShowBrandSuggestions(true);
        }
      } catch (err) {
        console.error(`Error searching ${type}s:`, err);
      }
    } else {
      setCategorySuggestions(categories);
      setBrandSuggestions(brands);
      if (type === 'category') setShowCategorySuggestions(true);
      else setShowBrandSuggestions(true);
    }
  };

  const handleClickOutside = (e) => {
    if (categoryInputRef.current && !categoryInputRef.current.contains(e.target)) {
      setShowCategorySuggestions(false);
    }
    if (brandInputRef.current && !brandInputRef.current.contains(e.target)) {
      setShowBrandSuggestions(false);
    }
  };

  const handleSuggestionClick = (type, value) => {
    setFormData({ ...formData, [type]: value });
    if (type === 'category') setShowCategorySuggestions(false);
    else setShowBrandSuggestions(false);
  };

  const handleAddCategory = async () => {
    if (!newCategory) {
      setCategoryError('Please enter a category name.');
      return;
    }
    setAddingCategory(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/store/addCategory',
        { name: newCategory },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        const newCat = response.data.category;
        setCategories([...categories, newCat]);
        setCategorySuggestions([...categorySuggestions, newCat]);
        setFormData({ ...formData, category: newCat.name });
        setNewCategory('');
        setCategoryError('');
      } else {
        setCategoryError(response.data.message || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setCategoryError('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrand) {
      setBrandError('Please enter a brand name.');
      return;
    }
    setAddingBrand(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/api/store/addBrand',
        { name: newBrand },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        const newBrd = response.data.brand;
        setBrands([...brands, newBrd]);
        setBrandSuggestions([...brandSuggestions, newBrd]);
        setFormData({ ...formData, brand: newBrd.name });
        setNewBrand('');
        setBrandError('');
      } else {
        setBrandError(response.data.message || 'Failed to add brand');
      }
    } catch (err) {
      console.error('Error adding brand:', err);
      setBrandError('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAddingBrand(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const dataToSubmit = { ...formData };
    dataToSubmit.profitMargin = formData.profitMarginValue || null;
    delete dataToSubmit.profitMarginValue;

    try {
      const response = await axios.post(
        'http://localhost:3000/api/store/saveProduct',
        dataToSubmit,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        setModalIsOpen(false);
        setSuccessMessage(response.data.message);
        fetchInventoryData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.data.message || 'Failed to save product');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const confirmDelete = async () => {
    setError('');
    try {
      const response = await axios.post(
        `http://localhost:3000/api/store/deleteProduct/${deleteProductId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        setDeleteModalIsOpen(false);
        setSuccessMessage(response.data.message);
        fetchInventoryData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(`Unable to delete product: ${err.response?.data?.message || 'An unexpected error occurred'}. Please try again.`);
    }
  };

  const calculateProfitMargin = (product) => {
    const sellingPrice = parseFloat(product.sellingPrice) || 0;
    const purchasedPrice = parseFloat(product.purchasedPrice) || 0;
    return (sellingPrice - purchasedPrice).toFixed(2);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="inventory-header">
          <i className="fas fa-box-open me-2"></i> Inventory Management
        </div>
        {successMessage && (
          <div className="inventory-alert-success animate__animated animate__fadeIn">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="inventory-alert-danger animate__animated animate__fadeIn">
            {error}
          </div>
        )}

        <div className="search-card animate__animated animate__fadeInLeft">
          <div className="card-body">
            <form onSubmit={(e) => { e.preventDefault(); filterProducts(searchFilters); }}>
              <div className="row g-2">
                <div className="col-md-3 col-sm-6">
                  <label htmlFor="keywords" className="form-label">Search Keywords</label>
                  <input
                    type="text"
                    id="keywords"
                    name="keywords"
                    className="form-control"
                    placeholder="Enter name or code"
                    value={searchFilters.keywords}
                    onChange={handleSearchInputChange}
                  />
                </div>
                <div className="col-md-2 col-sm-6">
                  <label htmlFor="category" className="form-label">Category</label>
                  <div className="searchable-dropdown">
                    <select
                      id="categorySelect"
                      className="form-select d-none"
                      name="category"
                      value={searchFilters.category}
                      onChange={handleSearchInputChange}
                    >
                      <option value="">[Any Category]</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      className="form-control"
                      placeholder="Search category"
                      value={searchFilters.category}
                      onChange={handleSearchInputChange}
                      onFocus={() => setShowCategorySuggestions(true)}
                    />
                    {showCategorySuggestions && (
                      <div className="suggestions">
                        {categorySuggestions
                          .filter(cat => cat.name.toLowerCase().includes(searchFilters.category.toLowerCase()))
                          .map(cat => (
                            <div
                              key={cat.id}
                              className="dropdown-item"
                              onClick={() => {
                                setSearchFilters({ ...searchFilters, category: cat.name });
                                setShowCategorySuggestions(false);
                                filterProducts({ ...searchFilters, category: cat.name });
                              }}
                            >
                              {cat.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label htmlFor="brand" className="form-label">Brand</label>
                  <div className="searchable-dropdown">
                    <select
                      id="brandSelect"
                      className="form-select d-none"
                      name="brand"
                      value={searchFilters.brand}
                      onChange={handleSearchInputChange}
                    >
                      <option value="">[Any Brand]</option>
                      {brands.map(brd => (
                        <option key={brd.id} value={brd.name}>{brd.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      className="form-control"
                      placeholder="Search brand"
                      value={searchFilters.brand}
                      onChange={handleSearchInputChange}
                      onFocus={() => setShowBrandSuggestions(true)}
                    />
                    {showBrandSuggestions && (
                      <div className="suggestions">
                        {brandSuggestions
                          .filter(brd => brd.name.toLowerCase().includes(searchFilters.brand.toLowerCase()))
                          .map(brd => (
                            <div
                              key={brd.id}
                              className="dropdown-item"
                              onClick={() => {
                                setSearchFilters({ ...searchFilters, brand: brd.name });
                                setShowBrandSuggestions(false);
                                filterProducts({ ...searchFilters, brand: brd.name });
                              }}
                            >
                              {brd.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-md-2 col-sm-6">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={searchFilters.status}
                    onChange={handleSearchInputChange}
                  >
                    <option value="all">ALL</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-6">
                  <label htmlFor="barcode" className="form-label">Barcode</label>
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    className="form-control"
                    placeholder=""
                    value={searchFilters.barcode}
                    onChange={handleSearchInputChange}
                  />
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-md-12 d-flex justify-content-start align-items-center">
                  <button type="button" className="btn-custom me-2" onClick={resetSearch}>
                    <i className="fas fa-undo me-1"></i> Reset
                  </button>
                  <button type="submit" className="btn-custom">
                    <i className="fas fa-search me-1"></i> Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-2">
          <button
            className="btn-custom animate__animated animate__fadeInRight"
            onClick={() => openModal('add')}
          >
            <i className="fas fa-plus me-1"></i> Add Product
          </button>
        </div>

        <div className="results-card animate__animated animate__fadeInUp">
          <div className="card-body">
            {filteredProducts.length === 0 && (
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-circle me-1"></i> No products found, try to clear the search
              </div>
            )}
            <table className="inventory-table">
              <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('productName')}>
                  Product Name {sortField === 'productName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('productDescription')}>
                  Description {sortField === 'productDescription' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('productSKU')}>
                  SKU {sortField === 'productSKU' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('productBarcode')}>
                  Barcode {sortField === 'productBarcode' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('sellingPrice')}>
                  Selling Price {sortField === 'sellingPrice' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('productQuantity')}>
                  Quantity {sortField === 'productQuantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('categoryName')}>
                  Category {sortField === 'categoryName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('brandName')}>
                  Brand {sortField === 'brandName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {showProfitMargin && (
                  <th>Profit Margin</th>
                )}
                <th>Actions</th>
              </tr>
              </thead>
              <tbody>
              {paginate().map((product) => (
                <tr key={product.id}>
                  <td>{product.productName}</td>
                  <td>{product.productDescription}</td>
                  <td>{product.productSKU}</td>
                  <td>{product.productBarcode}</td>
                  <td>{product.sellingPrice}</td>
                  <td>{product.productQuantity}</td>
                  <td>{product.categoryName || ''}</td>
                  <td>{product.brandName || ''}</td>
                  <td>{product.status?.toLowerCase() || ''}</td>
                  {showProfitMargin && (
                    <td>{calculateProfitMargin(product)}</td>
                  )}
                  <td>
                    <button
                      className="btn-custom me-1"
                      onClick={() => openModal('edit', product)}
                    >
                      <i className="fas fa-pencil-alt me-1"></i> Edit
                    </button>
                    <button
                      className="btn-custom"
                      onClick={() => openDeleteModal(product.id)}
                    >
                      <i className="fas fa-trash me-1"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination-container">
          {filteredProducts.length > 0 ? (
            <ul className="pagination justify-content-center animate__animated animate__fadeIn">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
              </li>
              {[...Array(totalPages).keys()].map((_, index) => (
                <li
                  key={index + 1}
                  className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          ) : (
            <ul className="pagination justify-content-center animate__animated animate__fadeIn">
              <li className="page-item disabled">
                <span className="page-link">No results</span>
              </li>
            </ul>
          )}
        </div>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          className="modal-content modal-lg"
          overlayClassName="modal-overlay"
        >
          <div className="modal-header">
            <h4 className="modal-title">{modalTitle}</h4>
            <button
              type="button"
              className="btn-custom"
              onClick={() => setModalIsOpen(false)}
            >
              <i className="fas fa-times me-1"></i> Cancel
            </button>
            <button
              type="button"
              className="btn-custom"
              onClick={handleSubmit}
            >
              <i className="fas fa-save me-1"></i> Save
            </button>
          </div>
          <div className="modal-body">
            {error && <div className="inventory-alert-danger">{error}</div>}
            <form>
              <input type="hidden" name="id" value={formData.id} />
              <ul className="nav nav-tabs" id="productTabs" role="tablist">
                <li className="nav-item">
                  <a
                    className="nav-link active"
                    id="item-details-tab"
                    data-bs-toggle="tab"
                    href="#item-details"
                    role="tab"
                  >
                    Item Details
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    id="inventory-tab"
                    data-bs-toggle="tab"
                    href="#inventory"
                    role="tab"
                  >
                    Inventory
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    id="margin-tab"
                    data-bs-toggle="tab"
                    href="#margin"
                    role="tab"
                  >
                    Margin
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    id="additional-tab"
                    data-bs-toggle="tab"
                    href="#additional"
                    role="tab"
                  >
                    Additional Details
                  </a>
                </li>
              </ul>
              <div className="tab-content mt-3" id="productTabContent">
                <div className="tab-pane fade show active" id="item-details" role="tabpanel">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="productName" className="form-label">Name</label>
                        <input
                          type="text"
                          id="productName"
                          name="productName"
                          className="form-control"
                          value={formData.productName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="productSKU" className="form-label">SKU</label>
                        <input
                          type="text"
                          id="productSKU"
                          name="productSKU"
                          className="form-control"
                          value={formData.productSKU}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3 searchable-dropdown" ref={categoryInputRef}>
                        <label htmlFor="category" className="form-label">Category</label>
                        <div className="input-group">
                          <select
                            id="categorySelectModal"
                            className="form-select d-none"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            id="category"
                            name="category"
                            className="form-control"
                            placeholder="Search category"
                            value={formData.category}
                            onChange={(e) => handleSearchableInputChange('category', e.target.value)}
                            onFocus={() => setShowCategorySuggestions(true)}
                          />
                          {showCategorySuggestions && (
                            <div className="suggestions">
                              {categorySuggestions
                                .filter(cat => cat.name.toLowerCase().includes(formData.category.toLowerCase()))
                                .map(cat => (
                                  <div
                                    key={cat.id}
                                    className="dropdown-item"
                                    onClick={() => handleSuggestionClick('category', cat.name)}
                                  >
                                    {cat.name}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="newCategoryInput" className="form-label">Add New Category</label>
                        <div className="input-group">
                          <input
                            type="text"
                            id="newCategoryInput"
                            className="form-control"
                            placeholder="Enter new category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-custom"
                            onClick={handleAddCategory}
                            disabled={addingCategory}
                          >
                            {addingCategory ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <><i className="fas fa-plus me-1"></i> Add</>
                            )}
                          </button>
                        </div>
                        {categoryError && <div className="inventory-alert-danger mt-2">{categoryError}</div>}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="productDescription" className="form-label">Description</label>
                        <textarea
                          id="productDescription"
                          name="productDescription"
                          className="form-control"
                          value={formData.productDescription}
                          onChange={handleInputChange}
                          required
                          rows="3"
                        ></textarea>
                      </div>
                      <div className="mb-3 searchable-dropdown" ref={brandInputRef}>
                        <label htmlFor="brand" className="form-label">Brand</label>
                        <div className="input-group">
                          <select
                            id="brandSelectModal"
                            className="form-select d-none"
                            name="brand"
                            value={formData.brand}
                            onChange={handleInputChange}
                          >
                            <option value="">Select Brand</option>
                            {brands.map(brd => (
                              <option key={brd.id} value={brd.name}>{brd.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            id="brand"
                            name="brand"
                            className="form-control"
                            placeholder="Search brand"
                            value={formData.brand}
                            onChange={(e) => handleSearchableInputChange('brand', e.target.value)}
                            onFocus={() => setShowBrandSuggestions(true)}
                          />
                          {showBrandSuggestions && (
                            <div className="suggestions">
                              {brandSuggestions
                                .filter(brd => brd.name.toLowerCase().includes(formData.brand.toLowerCase()))
                                .map(brd => (
                                  <div
                                    key={brd.id}
                                    className="dropdown-item"
                                    onClick={() => handleSuggestionClick('brand', brd.name)}
                                  >
                                    {brd.name}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="newBrandInput" className="form-label">Add New Brand</label>
                        <div className="input-group">
                          <input
                            type="text"
                            id="newBrandInput"
                            className="form-control"
                            placeholder="Enter new brand"
                            value={newBrand}
                            onChange={(e) => setNewBrand(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-custom"
                            onClick={handleAddBrand}
                            disabled={addingBrand}
                          >
                            {addingBrand ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <><i className="fas fa-plus me-1"></i> Add</>
                            )}
                          </button>
                        </div>
                        {brandError && <div className="inventory-alert-danger mt-2">{brandError}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-pane fade" id="inventory" role="tabpanel">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="productQuantity" className="form-label">Stock Level</label>
                        <input
                          type="number"
                          id="productQuantity"
                          name="productQuantity"
                          className="form-control"
                          value={formData.productQuantity}
                          onChange={handleInputChange}
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="lowStockThreshold" className="form-label">Low Stock Threshold</label>
                        <input
                          type="number"
                          id="lowStockThreshold"
                          name="productQuantity"
                          className="form-control"
                          value={formData.lowStockThreshold}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="productBarcode" className="form-label">Barcode</label>
                        <input
                          type="text"
                          id="productBarcode"
                          name="productBarcode"
                          className="form-control"
                          value={formData.productBarcode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-pane fade" id="margin" role="tabpanel">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="purchasedPrice" className="form-label">Purchase Price</label>
                        <input
                          type="number"
                          step="0.01"
                          id="purchasedPrice"
                          name="purchasedPrice"
                          className="form-control"
                          value={formData.purchasedPrice}
                          onChange={handleInputChange}
                          required
                          min="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="sellingPrice" className="form-label">Selling Price</label>
                        <input
                          type="number"
                          step="0.01"
                          id="sellingPrice"
                          name="sellingPrice"
                          className="form-control"
                          value={formData.sellingPrice}
                          onChange={handleInputChange}
                          min="0.01"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="profitMargin" className="form-label">Profit Margin (%)</label>
                        <input
                          type="text"
                          id="profitMargin"
                          name="profitMargin"
                          className="form-control"
                          value={formData.profitMargin}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="tab-pane fade" id="additional" role="tabpanel">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                          id="status"
                          name="status"
                          className="form-select"
                          value={formData.status}
                          onChange={handleInputChange}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="tags" className="form-label">Tags</label>
                        <input
                          type="text"
                          id="tags"
                          name="tags"
                          className="form-control"
                          value={formData.tags}
                          onChange={handleInputChange}
                          placeholder="Enter tags separated by commas"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={deleteModalIsOpen}
          onRequestClose={() => setDeleteModalIsOpen(false)}
          className="modal-content modal-sm"
          overlayClassName="modal-overlay"
        >
          <div className="modal-header">
            <h4 className="modal-title">Confirm Delete</h4>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete this product?</p>
            {error && <div className="inventory-alert-danger">{error}</div>}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn-custom"
              onClick={() => setDeleteModalIsOpen(false)}
            >
              <i className="fas fa-times me-1"></i> Cancel
            </button>
            <button
              type="button"
              className="btn-custom"
              onClick={confirmDelete}
            >
              <i className="fas fa-trash me-1"></i> Delete
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Inventory;
