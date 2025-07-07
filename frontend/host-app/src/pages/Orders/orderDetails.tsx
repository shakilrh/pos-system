import React, { useState, useEffect } from 'react';
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

interface OrderItem {
  product_id: string;
  quantity: number;
  product?: Product;
  sub_total?: number;
}

export interface OrderDetailsProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  serviceType: 'dine_in' | 'take_away';
  setServiceType: (type: 'dine_in' | 'take_away') => void;
  receivedAmount: number;
  setReceivedAmount: (amount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  calculateTotalOrderAmount: () => number;
  handleCreateOrder: () => void;
  localLoading: boolean;
}

const OrderDetails = ({
                        customerName,
                        setCustomerName,
                        serviceType,
                        setServiceType,
                        receivedAmount,
                        setReceivedAmount,
                        paymentMethod,
                        setPaymentMethod,
                        orderItems,
                        setOrderItems,
                        calculateTotalOrderAmount,
                        handleCreateOrder,
                        localLoading,
                      }: OrderDetailsProps) => {
  const [errors, setErrors] = useState<{
    customerName?: string[];
    receivedAmount?: string[];
    paymentMethod?: string[];
    orderItems?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const totalAmount = calculateTotalOrderAmount();
  const showPayment = serviceType === 'take_away';

  // Validation functions
  const validateCustomerName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Customer name is required');
    } else {
      if (name.length < 2) errors.push('Customer name must be at least 2 characters long');
      if (name.length > 50) errors.push('Customer name must be less than 50 characters');
      if (!/^[A-Za-z\s'-]+$/.test(name)) errors.push('Customer name can only contain letters, spaces, hyphens, and apostrophes');
      if (/^\s|\s$/.test(name)) errors.push('Customer name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Customer name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateReceivedAmount = (amount: number): string[] => {
    const errors: string[] = [];
    if (showPayment) {
      if (!amount || amount <= 0) {
        errors.push('Received amount is required for takeaway orders');
      } else if (amount < totalAmount) {
        errors.push(`Received amount must be at least $${totalAmount.toFixed(2)}`);
      } else if (amount > 999999) {
        errors.push('Received amount is too large');
      }
    }
    return errors;
  };

  const validatePaymentMethod = (method: string): string[] => {
    const errors: string[] = [];
    if (showPayment) {
      if (!method) {
        errors.push('Payment method is required for takeaway orders');
      } else if (!['cash', 'card'].includes(method)) {
        errors.push('Please select a valid payment method');
      }
    }
    return errors;
  };

  const validateOrderItems = (items: OrderItem[]): string[] => {
    const errors: string[] = [];
    if (!items || items.length === 0) {
      errors.push('At least one item must be added to the order');
    } else {
      // Check for items with invalid quantities
      const invalidItems = items.filter(item => !item.quantity || item.quantity <= 0);
      if (invalidItems.length > 0) {
        errors.push('All items must have a valid quantity');
      }
    }
    return errors;
  };

  // Get field errors
  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'customerName':
        return validateCustomerName(customerName);
      case 'receivedAmount':
        return validateReceivedAmount(receivedAmount);
      case 'paymentMethod':
        return validatePaymentMethod(paymentMethod);
      case 'orderItems':
        return validateOrderItems(orderItems);
      default:
        return [];
    }
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    const customerNameValid = validateCustomerName(customerName).length === 0;
    const orderItemsValid = validateOrderItems(orderItems).length === 0;

    if (!showPayment) {
      // For dine-in, only customer name and order items are required
      return customerNameValid && orderItemsValid;
    }

    // For takeaway, all fields including payment are required
    const receivedAmountValid = validateReceivedAmount(receivedAmount).length === 0;
    const paymentMethodValid = validatePaymentMethod(paymentMethod).length === 0;

    return customerNameValid && orderItemsValid && receivedAmountValid && paymentMethodValid;
  };

  // Handle input changes with validation
  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCustomerName(value);

    // Only validate if field is touched
    if (touchedFields.has('customerName')) {
      setErrors(prev => ({
        ...prev,
        customerName: validateCustomerName(value)
      }));
    }
  };

  const handleReceivedAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setReceivedAmount(value);

    // Only validate if field is touched
    if (touchedFields.has('receivedAmount')) {
      setErrors(prev => ({
        ...prev,
        receivedAmount: validateReceivedAmount(value)
      }));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    // Clear previous payment method if same method is clicked
    const newMethod = paymentMethod === method ? '' : method;
    setPaymentMethod(newMethod);

    // Only validate if field is touched
    if (touchedFields.has('paymentMethod')) {
      setErrors(prev => ({
        ...prev,
        paymentMethod: validatePaymentMethod(newMethod)
      }));
    }
  };

  // Handle field focus - mark as touched
  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    // Show validation errors when field is focused
    setErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName)
    }));
  };

  // Handle field blur - validate if touched
  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName)
      }));
    }
  };

  // Update order items validation when items change, but only if touched
  useEffect(() => {
    // Only validate order items if they've been interacted with
    if (touchedFields.has('orderItems')) {
      setErrors(prev => ({
        ...prev,
        orderItems: validateOrderItems(orderItems)
      }));
    }
  }, [orderItems, touchedFields]);

  // Clear payment-related errors when switching to dine-in
  useEffect(() => {
    if (serviceType === 'dine_in') {
      setErrors(prev => ({
        ...prev,
        receivedAmount: [],
        paymentMethod: []
      }));
      // Clear payment method when switching to dine-in
      setPaymentMethod('');
      // Remove payment fields from touched state
      setTouchedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('receivedAmount');
        newSet.delete('paymentMethod');
        return newSet;
      });
    }
  }, [serviceType, setPaymentMethod]);

  // Enhanced order creation with validation
  const handleEnhancedCreateOrder = () => {
    // Mark all relevant fields as touched
    const fieldsToValidate = ['customerName', 'orderItems'];
    if (showPayment) {
      fieldsToValidate.push('receivedAmount', 'paymentMethod');
    }

    setTouchedFields(new Set(fieldsToValidate));

    // Validate all fields
    const allErrors: any = {};
    fieldsToValidate.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });

    setErrors(allErrors);

    // Check if there are any errors
    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);

    if (!hasErrors) {
      handleCreateOrder();
    }
  };

  // Handle order items interaction - mark as touched
  const handleOrderItemsInteraction = () => {
    setTouchedFields(prev => new Set(prev).add('orderItems'));
  };

  // Render field errors
  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0) return null;

    return (
      <div className="mt-1 space-y-1">
        {fieldErrors.map((error, index) => (
          <p key={index} className="text-red-500 text-xs flex items-start">
            <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="lg:w-1/3 w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={handleCustomerNameChange}
            onFocus={() => handleFocus('customerName')}
            onBlur={() => handleBlur('customerName')}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
              errors.customerName && errors.customerName.length > 0
                ? 'border-red-500 ring-1 ring-red-500'
                : 'border-gray-300'
            }`}
          />
          {renderFieldErrors('customerName')}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
            className="w-full p-2 border rounded-lg focus:ring-2 transition-all duration-200 product-crud-input focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)]"
            style={{
              backgroundColor: 'var(--background-secondary)',
              color: 'var(--text-color)',
              borderColor: 'var(--border-color)',
            }}
          >
            <option value="dine_in">Dine-In</option>
            <option value="take_away">Takeaway</option>
          </select>
        </div>

        {showPayment && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount *</label>
              <input
                type="number"
                value={receivedAmount || ''}
                onChange={handleReceivedAmountChange}
                onFocus={() => handleFocus('receivedAmount')}
                onBlur={() => handleBlur('receivedAmount')}
                min={totalAmount}
                step="0.01"
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 ${
                  errors.receivedAmount && errors.receivedAmount.length > 0
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder={`Minimum: $${totalAmount.toFixed(2)}`}
              />
              {renderFieldErrors('receivedAmount')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method *</label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentMethod === 'cash'}
                    onChange={() => handlePaymentMethodChange('cash')}
                    onFocus={() => handleFocus('paymentMethod')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Cash</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentMethod === 'card'}
                    onChange={() => handlePaymentMethodChange('card')}
                    onFocus={() => handleFocus('paymentMethod')}
                    className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Card</span>
                </label>
              </div>
              {renderFieldErrors('paymentMethod')}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold">Order Summary</h3>
          {orderItems.length === 0 ? (
            <div onClick={handleOrderItemsInteraction}>
              <p className="text-gray-500">No items added to the order</p>
              {renderFieldErrors('orderItems')}
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                  <th className="py-2 px-4">Item</th>
                  <th className="py-2 px-4">Qty</th>
                  <th className="py-2 px-4">Price</th>
                  <th className="py-2 px-4">Total</th>
                  <th className="py-2 px-4">Action</th>
                </tr>
                </thead>
                <tbody>
                {orderItems.map((item, index) => (
                  <tr key={item.product_id} className="border-b">
                    <td className="py-2 px-4">{item.product?.name || `Product ${item.product_id}`}</td>
                    <td className="py-2 px-4">{item.quantity}</td>
                    <td className="py-2 px-4">${(item.product?.price || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">${(item.sub_total || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <XMarkIcon
                        onClick={() => {
                          handleOrderItemsInteraction();
                          setOrderItems(orderItems.filter((_, i) => i !== index));
                        }}
                        className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={3} className="py-2 px-4 text-right">Total</td>
                  <td className="py-2 px-4">${totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
                </tbody>
              </table>
              {renderFieldErrors('orderItems')}
            </>
          )}
        </div>

        <button
          onClick={handleEnhancedCreateOrder}
          disabled={localLoading || !isFormValid()}
          className={`w-full py-2 rounded-lg transition-all duration-200 ${
            localLoading || !isFormValid()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[var(--primary-color)] text-[var(--surface-color)] hover:bg-opacity-90 hover:text-white'
          }`}
        >
          {localLoading ? 'Processing Order...' : showPayment ? 'Confirm Order & Process Payment' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
};

export default OrderDetails;
