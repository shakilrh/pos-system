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
      const invalidItems = items.filter(item => !item.quantity || item.quantity <= 0);
      if (invalidItems.length > 0) {
        errors.push('All items must have a valid quantity');
      }
    }
    return errors;
  };

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

  const isFormValid = (): boolean => {
    const customerNameValid = validateCustomerName(customerName).length === 0;
    const orderItemsValid = validateOrderItems(orderItems).length === 0;

    if (!showPayment) {
      return customerNameValid && orderItemsValid;
    }

    const receivedAmountValid = validateReceivedAmount(receivedAmount).length === 0;
    const paymentMethodValid = validatePaymentMethod(paymentMethod).length === 0;

    return customerNameValid && orderItemsValid && receivedAmountValid && paymentMethodValid;
  };

  const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCustomerName(value);

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

    if (touchedFields.has('receivedAmount')) {
      setErrors(prev => ({
        ...prev,
        receivedAmount: validateReceivedAmount(value)
      }));
    }
  };

  const handlePaymentMethodChange = (method: string) => {
    const newMethod = paymentMethod === method ? '' : method;
    setPaymentMethod(newMethod);

    if (touchedFields.has('paymentMethod')) {
      setErrors(prev => ({
        ...prev,
        paymentMethod: validatePaymentMethod(newMethod)
      }));
    }
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

  useEffect(() => {
    if (touchedFields.has('orderItems')) {
      setErrors(prev => ({
        ...prev,
        orderItems: validateOrderItems(orderItems)
      }));
    }
  }, [orderItems, touchedFields]);

  useEffect(() => {
    if (serviceType === 'dine_in') {
      setErrors(prev => ({
        ...prev,
        receivedAmount: [],
        paymentMethod: []
      }));
      setPaymentMethod('');
      setTouchedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('receivedAmount');
        newSet.delete('paymentMethod');
        return newSet;
      });
    }
  }, [serviceType, setPaymentMethod]);

  const handleEnhancedCreateOrder = () => {
    const fieldsToValidate = ['customerName', 'orderItems'];
    if (showPayment) {
      fieldsToValidate.push('receivedAmount', 'paymentMethod');
    }

    setTouchedFields(new Set(fieldsToValidate));

    const allErrors: any = {};
    fieldsToValidate.forEach(field => {
      allErrors[field] = getFieldErrors(field);
    });

    setErrors(allErrors);

    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);

    if (!hasErrors) {
      handleCreateOrder();
    }
  };

  const handleOrderItemsInteraction = () => {
    setTouchedFields(prev => new Set(prev).add('orderItems'));
  };

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
              Order Details
            </h1>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cardText)' }}>Customer Name *</label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  onFocus={() => handleFocus('customerName')}
                  onBlur={() => handleBlur('customerName')}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200 ${
                    errors.customerName && errors.customerName.length > 0
                      ? 'border-[var(--error-color)] ring-1 ring-[var(--error-color)]'
                      : 'border-[var(--border-color)]'
                  }`}
                  style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-color)' }}
                />
                {renderFieldErrors('customerName')}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cardText)' }}>Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
                  className="w-full p-2 border rounded-lg focus:ring-2 transition-all duration-200 focus:ring-[var(--primary-color)]"
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
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cardText)' }}>Received Amount *</label>
                    <input
                      type="number"
                      value={receivedAmount || ''}
                      onChange={handleReceivedAmountChange}
                      onFocus={() => handleFocus('receivedAmount')}
                      onBlur={() => handleBlur('receivedAmount')}
                      min={totalAmount}
                      step="0.01"
                      className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200 ${
                        errors.receivedAmount && errors.receivedAmount.length > 0
                          ? 'border-[var(--error-color)] ring-1 ring-[var(--error-color)]'
                          : 'border-[var(--border-color)]'
                      }`}
                      placeholder={`Minimum: $${totalAmount.toFixed(2)}`}
                      style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-color)' }}
                    />
                    {renderFieldErrors('receivedAmount')}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--cardText)' }}>Payment Method *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentMethod === 'cash'}
                          onChange={() => handlePaymentMethodChange('cash')}
                          onFocus={() => handleFocus('paymentMethod')}
                          className="mr-2 h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] border-[var(--border-color)] rounded"
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--cardText)' }}>Cash</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentMethod === 'card'}
                          onChange={() => handlePaymentMethodChange('card')}
                          onFocus={() => handleFocus('paymentMethod')}
                          className="mr-2 h-4 w-4 text-[var(--primary-color)] focus:ring-[var(--primary-color)] border-[var(--border-color)] rounded"
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--cardText)' }}>Card</span>
                      </label>
                    </div>
                    {renderFieldErrors('paymentMethod')}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--cardText)' }}>Order Summary</h3>
                {orderItems.length === 0 ? (
                  <div onClick={handleOrderItemsInteraction}>
                    <p style={{ color: 'var(--cardText)' }}>No items added to the order</p>
                    {renderFieldErrors('orderItems')}
                  </div>
                ) : (
                  <>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#4a4a4a' }}>
                          <th className="py-2 px-4" style={{ color: 'var(--cardText)' }}>Item</th>
                          <th className="py-2 px-4" style={{ color: 'var(--cardText)' }}>Qty</th>
                          <th className="py-2 px-4" style={{ color: 'var(--cardText)' }}>Price</th>
                          <th className="py-2 px-4" style={{ color: 'var(--cardText)' }}>Total</th>
                          <th className="py-2 px-4" style={{ color: 'var(--cardText)' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, index) => (
                          <tr key={item.product_id} className="border-b" style={{ borderColor: '#4a4a4a' }}>
                            <td className="py-2 px-4" style={{ color: 'var(--cardText)' }}>{item.product?.name || `Product ${item.product_id}`}</td>
                            <td className="py-2 px-4" style={{ color: 'var(--cardText)' }}>{item.quantity}</td>
                            <td className="py-2 px-4" style={{ color: 'var(--cardText)' }}>${(item.product?.price || 0).toFixed(2)}</td>
                            <td className="py-2 px-4" style={{ color: 'var(--cardText)' }}>${(item.sub_total || 0).toFixed(2)}</td>
                            <td className="py-2 px-4">
                              <XMarkIcon
                                onClick={() => {
                                  handleOrderItemsInteraction();
                                  setOrderItems(orderItems.filter((_, i) => i !== index));
                                }}
                                className="h-5 w-5 cursor-pointer hover:text-[var(--error-color-hover)]"
                                style={{ color: 'var(--error-color)' }}
                              />
                            </td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td colSpan={3} className="py-2 px-4 text-right" style={{ color: 'var(--cardText)' }}>Total</td>
                          <td className="py-2 px-4" style={{ color: 'var(--cardText)' }}>${totalAmount.toFixed(2)}</td>
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
                    ? 'bg-[var(--background-secondary)] text-[var(--text-secondary)] cursor-not-allowed'
                    : 'bg-[var(--primary-color)] text-[var(--sidebar-text)] hover:bg-[var(--primary-700)]'
                }`}
              >
                {localLoading ? 'Processing Order...' : showPayment ? 'Confirm Order & Process Payment' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;