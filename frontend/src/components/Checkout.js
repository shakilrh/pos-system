import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductByBarcode, saveOrder } from '../utils/api';
import Sidebar from './Sidebar';

const Checkout = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    barcode: '',
    amountReceived: '',
    amountReturned: '',
    discountAmount: 0,
  });
  const [items, setItems] = useState([]);
  const [totals, setTotals] = useState({
    subtotal: 0,
    totalProfit: 0,
    total: 0,
    leaseAmount: 0,
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showProfit, setShowProfit] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const barcodeInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    barcodeInputRef.current.focus();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [items, formData.discountAmount, formData.amountReceived, formData.amountReturned]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setShowProfit(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setShowProfit(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccessMessage('');
  };

  const handleAddProduct = async () => {
    if (!formData.barcode.trim()) {
      setErrors({ barcode: 'Please enter a barcode.' });
      setSuccessMessage('');
      return;
    }

    try {
      const response = await getProductByBarcode(formData.barcode);
      const product = response.data;

      if (!product.sellingPrice || !product.purchasedPrice || product.productQuantity === undefined) {
        setErrors({ barcode: 'Invalid product data.' });
        setSuccessMessage('');
        return;
      }

      const newItem = {
        productBarcode: product.productBarcode || 'Unknown',
        productName: product.productName || 'Unknown Product',
        sellingPrice: product.sellingPrice || 0,
        purchasedPrice: product.purchasedPrice || 0,
        quantity: 1,
        subtotal: (product.sellingPrice || 0) * 1,
        totalProfit: ((product.sellingPrice || 0) - (product.purchasedPrice || 0)) * 1,
      };

      const existingItemIndex = items.findIndex(
        (item) => item.productBarcode === product.productBarcode
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingItemIndex].quantity += 1;
        updatedItems[existingItemIndex].subtotal =
          updatedItems[existingItemIndex].sellingPrice * updatedItems[existingItemIndex].quantity;
        updatedItems[existingItemIndex].totalProfit =
          (updatedItems[existingItemIndex].sellingPrice - updatedItems[existingItemIndex].purchasedPrice) *
          updatedItems[existingItemIndex].quantity;
        setItems(updatedItems);
        setSuccessMessage(`Quantity updated for ${product.productName}.`);
      } else {
        setItems((prev) => [...prev, newItem]);
        setSuccessMessage(`${product.productName} added successfully!`);
      }

      setFormData((prev) => ({ ...prev, barcode: '' }));
      setErrors({ barcode: '' });
    } catch (err) {
      console.error('Error fetching product:', err);
      setErrors({ barcode: err.response?.data?.message || 'Product not found!' });
      setSuccessMessage('');
    }
  };

  const addHardcodedProduct = () => {
    const hardcodedItem = {
      productBarcode: '12345',
      productName: 'Test Product',
      sellingPrice: 49000.00,
      purchasedPrice: 45000.00,
      quantity: 1,
      subtotal: 49000.00,
      totalProfit: (49000.00 - 45000.00) * 1,
    };
    setItems((prev) => [...prev, hardcodedItem]);
    setFormData((prev) => ({ ...prev, barcode: '' }));
    setSuccessMessage('Test Product added successfully!');
  };

  const handleQuantityChange = (index, value) => {
    const quantity = parseInt(value) || 1;
    if (quantity < 1) {
      setErrors((prev) => ({ ...prev, products: 'Quantity must be at least 1.' }));
      setSuccessMessage('');
      return;
    }

    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].subtotal = updatedItems[index].sellingPrice * quantity;
    updatedItems[index].totalProfit =
      (updatedItems[index].sellingPrice - updatedItems[index].purchasedPrice) * quantity;
    setItems(updatedItems);
    setErrors((prev) => ({ ...prev, products: '' }));
    setSuccessMessage(`Quantity updated for ${updatedItems[index].productName}.`);
  };

  const handleSellingPriceChange = (index, value) => {
    const sellingPrice = parseFloat(value) || 0;
    if (sellingPrice < 0) {
      setErrors((prev) => ({ ...prev, products: 'Selling price cannot be negative.' }));
      return;
    }

    const updatedItems = [...items];
    updatedItems[index].sellingPrice = sellingPrice;
    updatedItems[index].subtotal = sellingPrice * updatedItems[index].quantity;
    updatedItems[index].totalProfit =
      (sellingPrice - updatedItems[index].purchasedPrice) * updatedItems[index].quantity;
    setItems(updatedItems);
    setErrors((prev) => ({ ...prev, products: '' }));
    setSuccessMessage(`Selling price updated for ${updatedItems[index].productName}.`);
  };

  const handlePurchasedPriceChange = (index, value) => {
    const purchasedPrice = parseFloat(value) || 0;
    if (purchasedPrice < 0) {
      setErrors((prev) => ({ ...prev, products: 'Purchased price cannot be negative.' }));
      return;
    }

    const updatedItems = [...items];
    updatedItems[index].purchasedPrice = purchasedPrice;
    updatedItems[index].totalProfit =
      (updatedItems[index].sellingPrice - purchasedPrice) * updatedItems[index].quantity;
    setItems(updatedItems);
    setErrors((prev) => ({ ...prev, products: '' }));
    setSuccessMessage(`Purchased price updated for ${updatedItems[index].productName}.`);
  };

  const handleRemoveItem = (index) => {
    const itemName = items[index].productName;
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setSuccessMessage(`${itemName} removed from cart.`);
  };

  const calculateTotals = () => {
    const newSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const newTotalProfitBeforeDiscount = items.reduce(
      (sum, item) => sum + (item.totalProfit || 0),
      0
    );

    const discount = parseFloat(formData.discountAmount) || 0;
    let newTotal = newSubtotal - discount;
    if (newTotal < 0) newTotal = 0;

    const newTotalProfit = newTotalProfitBeforeDiscount - discount;
    if (newTotalProfit < 0) {
      setErrors((prev) => ({
        ...prev,
        discount: "Discount cannot exceed total profit.",
      }));
      return;
    }

    const received = parseFloat(formData.amountReceived) || 0;
    let returned = parseFloat(formData.amountReturned) || 0;

    if (returned > received) {
      returned = received;
      setFormData((prev) => ({
        ...prev,
        amountReturned: received.toFixed(2),
      }));
    }

    const newLeaseAmount = received - returned - newTotal;

    setTotals({
      subtotal: newSubtotal,
      totalProfit: newTotalProfit,
      total: newTotal,
      leaseAmount: newLeaseAmount,
    });

    validateDiscount(newTotalProfitBeforeDiscount, discount);
  };

  const validateDiscount = (totalProfitValue, discountAmount) => {
    if (discountAmount > totalProfitValue) {
      setErrors((prev) => ({
        ...prev,
        discount: "Discount cannot exceed total profit.",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, discount: '' }));
    return true;
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setSuccessMessage('Creating order...');
    setErrors({});

    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required.';
    }
    if (items.length === 0) {
      newErrors.items = 'At least one product must be added.';
    }
    if (totals.leaseAmount < 0 && !formData.amountReceived) {
      newErrors.amountReceived = 'Amount received is required.';
    }

    const invalidItems = items.filter(
      (item) => !item.quantity || item.quantity <= 0
    );
    if (invalidItems.length > 0) {
      newErrors.products = 'All products must have a quantity greater than zero.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage('');
      setIsProcessing(false);
      return;
    }

    try {
      const response = await saveOrder({
        customerName: formData.customerName,
        products: items.map((item) => ({
          productBarcode: item.productBarcode,
          quantity: item.quantity,
        })),
        amountReceived: parseFloat(formData.amountReceived) || 0,
        amountReturned: parseFloat(formData.amountReturned) || 0,
        discountAmount: parseFloat(formData.discountAmount) || 0,
        subtotal: totals.subtotal,
      });

      if (response.data.status === 'success') {
        setShowModal(true);
        setTimeout(() => {
          navigate(`/order-details/${response.data.orderId}`);
        }, 2000);
      } else {
        const { field, productBarcode, message } = response.data;
        if (field === 'customerName') {
          setErrors({ customerName: message });
        } else if (field === 'products' || field === 'stock') {
          const updatedItems = items.map((item) =>
            item.productBarcode === productBarcode ? { ...item, error: message } : item
          );
          setItems(updatedItems);
        } else if (field === 'amountReceived') {
          setErrors({ amountReceived: message });
        } else {
          setErrors({ general: message });
        }
        setSuccessMessage('');
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Server error occurred.' });
      setSuccessMessage('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="checkout-container">
          <div className="search-card">
            <div className="card-body">
              <h1 className="checkout-title">🛒 Checkout</h1>
              <p className="text-xs text-gray-600 mb-3">
                Hold the <strong>Shift</strong> key to view profit margins.
              </p>

              <div className="row">
                <div className="mb-2 col-md-6 col-sm-12">
                  <label className="form-label text-sm">Customer Name:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                  />
                  {errors.customerName && (
                    <div className="error-message">{errors.customerName}</div>
                  )}
                </div>
                <div className="mb-2 col-md-6 col-sm-12">
                  <label className="form-label text-sm">Scan Barcode:</label>
                  <div className="search-container">
                    <span className="search-icon">📷</span>
                    <input
                      type="text"
                      id="barcodeInput"
                      className="form-control"
                      placeholder="Scan barcode here..."
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddProduct()}
                      ref={barcodeInputRef}
                    />
                  </div>
                  <div className="mt-2">
                    <button className="btn-custom me-2" onClick={handleAddProduct}>
                      Add Product
                    </button>
                    <button type="button" className="btn-custom" onClick={addHardcodedProduct}>
                      Add Test Product
                    </button>
                  </div>
                  {errors.barcode && <div className="error-message">{errors.barcode}</div>}
                  {errors.items && <div className="error-message">{errors.items}</div>}
                </div>
              </div>

              {successMessage && <div className="alert-success">{successMessage}</div>}

              {items.length > 0 && (
                <div className="table-responsive overflow-x-auto">
                  <table id="itemsTable">
                    <thead>
                    <tr>
                      <th className="p-2">Product</th>
                      <th className="p-2">Item Price</th>
                      <th className="p-2" style={{ display: showProfit ? 'table-cell' : 'none' }}>
                        Purchased Price
                      </th>
                      <th className="p-2">Quantity</th>
                      <th className="p-2">Subtotal</th>
                      <th
                        className="profit-margin-col p-2"
                        style={{ display: showProfit ? 'table-cell' : 'none' }}
                      >
                        Profit Margin
                      </th>
                      <th className="p-2">Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="fade-row">
                        <td className="p-2">
                          {item.productName || 'N/A'}
                          <span className="product-barcode" style={{ display: 'none' }}>
                              {item.productBarcode}
                            </span>
                          {item.error && <div className="error-message">{item.error}</div>}
                        </td>
                        <td className="p-2 item-price">
                          <input
                            type="number"
                            className="form-control w-20 p-1"
                            value={item.sellingPrice.toFixed(2)}
                            onChange={(e) => handleSellingPriceChange(index, e.target.value)}
                          />
                        </td>
                        <td
                          className="p-2"
                          style={{ display: showProfit ? 'table-cell' : 'none' }}
                        >
                          <input
                            type="number"
                            className="form-control w-20 p-1"
                            value={item.purchasedPrice.toFixed(2)}
                            onChange={(e) => handlePurchasedPriceChange(index, e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            className="quantity-input w-12 p-1 border rounded"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            required
                          />
                          {errors.productBarcode === item.productBarcode && errors.stock && (
                            <div className="error-message">{errors.stock}</div>
                          )}
                        </td>
                        <td className="p-2 item-total">{item.subtotal.toFixed(2)} PKR</td>
                        <td
                          className="item-profit p-2"
                          data-profit={item.totalProfit}
                          style={{ display: showProfit ? 'table-cell' : 'none' }}
                        >
                          {(item.totalProfit || 0).toFixed(2)} PKR
                        </td>
                        <td className="p-2">
                          <button
                            className="btn-custom"
                            onClick={() => handleRemoveItem(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="search-card mt-3">
                <div className="card-body">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="col-4">
                      <h4 className="d-inline">Subtotal:</h4>
                      <h4 className="d-inline ms-2 text-green-600">{totals.subtotal.toFixed(2)} PKR</h4>
                    </div>
                    <div
                      className="col-4 total-profit-wrapper"
                      style={{ display: showProfit ? 'block' : 'none' }}
                    >
                      <h4 className="d-inline">Total Profit:</h4>
                      <h4 className="d-inline ms-2 text-green-600">{totals.totalProfit.toFixed(2)} PKR</h4>
                    </div>
                    <div className="col-4">
                      <h4 className="d-inline">Total:</h4>
                      <h4 className="d-inline ms-2 text-green-600">{totals.total.toFixed(2)} PKR</h4>
                    </div>
                  </div>

                  <div className="row mt-2">
                    <div className="col-12 col-md-4">
                      <label className="form-label text-sm">Discount Amount:</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        name="discountAmount"
                        value={formData.discountAmount}
                        onChange={handleInputChange}
                      />
                      {errors.discount && <div className="error-message">{errors.discount}</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mt-3">
                <div className="mb-2 col-md-4 col-sm-12">
                  <label className="form-label text-sm">Amount Received:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    name="amountReceived"
                    value={formData.amountReceived}
                    onChange={handleInputChange}
                  />
                  {errors.amountReceived && <div className="error-message">{errors.amountReceived}</div>}
                </div>
                <div className="mb-2 col-md-4 col-sm-12">
                  <label className="form-label text-sm">Amount Returned:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    name="amountReturned"
                    value={formData.amountReturned}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-2 col-md-4 col-sm-12">
                  <label className="form-label text-sm">Lease Amount:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={totals.leaseAmount.toFixed(2)}
                    readOnly
                  />
                </div>
              </div>

              <button
                className="btn-custom w-100 mt-3"
                onClick={handleCheckout}
                disabled={isProcessing || errors.discount}
              >
                {isProcessing ? 'Processing...' : 'Complete Checkout'}
              </button>

              {errors.general && <div className="alert-danger text-center mt-2 p-2">{errors.general}</div>}

              <div className="flex gap-2 mt-3">
                <button className="btn-custom mb-2" onClick={handleNewCheckout}>
                  New Checkout
                </button>
              </div>
            </div>
          </div>

          {showModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Checkout Completed!</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body text-center">
                  <p>Your order has been successfully placed. Redirecting to order details...</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-custom"
                    onClick={() => {
                      setShowModal(false);
                      navigate('/orders');
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
// /*test
