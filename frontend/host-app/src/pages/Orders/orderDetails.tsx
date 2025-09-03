import React, { useState, useEffect } from 'react';
import { Table } from '../../services/floorTableService';
import { Order } from '../../services/orderService';
import toast from 'react-hot-toast';
import AddToOrderForm from './addToOrder';
import { ChartBarIcon, ShoppingBagIcon, XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import UserService from '../../services/UserService';
import { useAuth } from '../../context/AuthContext';
import { printReceipt } from './printReceipt';
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

export interface OrderItem {
  product_id: string;
  quantity: number;
  product?: Product;
  sub_total?: number;
}

export interface Waiter {
  _id: string;
  name: string;
  email: string;
  user_type: 'waiter';
  role: string | null;
  created_by: {
    id: string;
    name: string;
    email: string;
    store_name: string;
    logoUrl: string;
    store_logo: string;
  };
}

export interface ThemeColors {
  cardBackground: string;
  cardBorder: string;
  cardText: string;
  headingText: string;
}
export interface OrderDetailsProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  serviceType: 'dine_in' | 'take_away';
  setServiceType: (type: 'dine_in' | 'take_away') => void;
  receivedAmount: number;
  setReceivedAmount: (amount: number) => void;
  paymentMethod: string;
  onClose?: () => void;
  setPaymentMethod: (method: string) => void;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  calculateTotalOrderAmount: () => number;
  handleCreateOrder: (orderData: any) => void;
  freeTables: Table[];
  selectedTableId: string | null;
  setSelectedTableId: (tableId: string | null) => void;
  token: string | null;
  logout: () => void;
  order?: Order;
  orders: Order[];
  waiterId: string | null;
  setWaiterId: (id: string | null) => void;
  freeWaiters: Waiter[];
  isAddToOrder: boolean;
  currentTheme?: string;
  currentCurrency?: string;
  createdOrder?: Order | null;
  selectedTable?: Table | null | undefined; // Updated to use Table type
  selectedWaiter?: Waiter | null;
  changeAmount?: number;
}
interface StoreInfo {
  storeName: string;
  phoneNumber: string | null;
  address: string | null;
  store_logo?: string;
  logoUrl?: string;
}

const CreateOrderForm = ({
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
                           freeTables,
                           selectedTableId,
                           setSelectedTableId,
                           waiterId,
                           setWaiterId,
                           freeWaiters,
                           token,
                           logout,
                           currentTheme,
                           currentCurrency = 'pkr',
                           createdOrder,
                           selectedTable,
                           selectedWaiter,
                           changeAmount = 0,
                         }: OrderDetailsProps) => {
  const { user } = useAuth();
  const [errors, setErrors] = useState<{
    customerName?: string[];
    receivedAmount?: string[];
    paymentMethod?: string[];
    orderItems?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [activeCurrency, setActiveCurrency] = useState(currentCurrency);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: 'POS Store',
    phoneNumber: null,
    address: null,
  });

  // Add loading state for order creation
  const [isLoading, setIsLoading] = useState({
    create: false
  });

  const totalAmount = calculateTotalOrderAmount();
  const showPayment = serviceType === 'take_away';

  // Function to get currency symbol based on current currency
  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      pkr: '₨',
      dollar: '$',
      euro: '€'
    };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  // Function to format price with currency
  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
  };

  // Function to get current currency from various sources
  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || currentCurrency || storedCurrency || 'pkr';
  };

  // Update currency when prop changes
  useEffect(() => {
    setActiveCurrency(currentCurrency);
  }, [currentCurrency]);

  // Listen for currency changes
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

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      setActiveCurrency(initialCurrency);
    }

    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency]);

  // Fetch store information
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!token) {
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: (user as any)?.phone_number || null,
          address: (user as any)?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
        return;
      }

      try {
        const response = await UserService.getUserDetails(token);
        setStoreInfo({
          storeName: response.store_name || response.name || 'POS Store',
          phoneNumber: (response as any).phone_number || null,
          address: (response as any).address || null,
          store_logo: response.store_logo || response.logoUrl,
        });
      } catch (err) {
        console.error('Fetch store data error:', err);
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: (user as any)?.phone_number || null,
          address: (user as any)?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
      }
    };

    fetchStoreData();
  }, [token, user]);

  const validateCustomerName = (name: string): string[] => {
    const errors: string[] = [];
    if (name.trim() && name.length > 0) {
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
        errors.push(`Received amount must be at least ${formatPrice(totalAmount, activeCurrency)}`);
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
    const orderItemsValid = validateOrderItems(orderItems).length === 0;
    const customerNameValid = validateCustomerName(customerName).length === 0;

    if (!showPayment) {
      return orderItemsValid;
    }

    const receivedAmountValid = validateReceivedAmount(receivedAmount).length === 0;
    const paymentMethodValid = validatePaymentMethod(paymentMethod).length === 0;

    return orderItemsValid && receivedAmountValid && paymentMethodValid;
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
    if (touchedFields.has('fieldName')) {
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
    if (serviceType === 'take_away') {
      setErrors(prev => ({
        ...prev,
        receivedAmount: [],
        paymentMethod: []
      }));
      setPaymentMethod('');
      setReceivedAmount(0);
      setSelectedTableId(null);
      setWaiterId(null);
      setTouchedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('receivedAmount');
        newSet.delete('paymentMethod');
        return newSet;
      });
    } else {
      setSelectedTableId(null);
    }
  }, [serviceType, setPaymentMethod, setReceivedAmount, setSelectedTableId, setWaiterId]);

  const handleEnhancedCreateOrder = async () => {
    const fieldsToValidate = ['orderItems'];
    if (customerName.trim().length > 0) {
      fieldsToValidate.push('customerName');
    }
    if (showPayment) {
      fieldsToValidate.push('receivedAmount', 'paymentMethod');
    }

    setTouchedFields(new Set(fieldsToValidate));

    const allErrors: any = {};
    for (const field of fieldsToValidate) {
      allErrors[field] = getFieldErrors(field);
    }

    setErrors(allErrors);

    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);

    if (!hasErrors) {
      // Set loading state to true when starting order creation
      setIsLoading(prev => ({ ...prev, create: true }));

      try {
        console.log('Sending waiter_id:', waiterId);
        const orderData = {
          customer_name: customerName || undefined,
          service_type: serviceType,
          order_items: orderItems,
          table_id: selectedTableId || undefined,
          waiter_id: waiterId || undefined,
          order_type: 'physical',
          ...(showPayment && {
            payment_method: paymentMethod,
            received_amount: receivedAmount,
          }),
        };
        await handleCreateOrder(orderData);
      } catch (error) {
        setErrors(prev => ({
          ...prev,
          orderItems: ['Failed to process order']
        }));
        toast.error(error instanceof Error ? error.message : 'Failed to process order');
      } finally {
        // Reset loading state regardless of success or failure
        setIsLoading(prev => ({ ...prev, create: false }));
      }
    }
  };

  const handleOrderItemsInteraction = () => {
    setTouchedFields(prev => new Set(prev).add('orderItems'));
  };

  // Direct print function without modal
  const handleDirectPrint = () => {
    if (!createdOrder) {
      toast.error('No order to print. Please create an order first.');
      return;
    }

    printReceipt({
      createdOrder,
      storeInfo,
      activeCurrency,
      selectedTable,
      selectedWaiter,
      changeAmount,
      paymentMethod,
      formatPrice,
    });
  };

  // Clear order function
  const handleClearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setServiceType('dine_in');
    setReceivedAmount(0);
    setPaymentMethod('cash');
    setSelectedTableId(null);
    setWaiterId(null);
    setErrors({});
    setTouchedFields(new Set());
    toast.success('Order cleared successfully');
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0) return null;

    return (
        <div className="mt-1 space-y-1">
          {fieldErrors.map((error, index) => (
              <p key={index} className="text-[var(--error-color)] text-xs flex items-start">
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
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center mb-4">
            <button className="mr-2" style={{ color: 'var(--text-secondary)' }}>
              <ChartBarIcon className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Order Details</h3>
          </div>
        </div>
        {/* Service Type */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
            Service Type *
          </label>
          <div className="flex space-x-4">
            <button
                type="button"
                onClick={() => setServiceType('dine_in')}
                className={`flex-1 py-2 px-4 rounded-md border transition-colors duration-200 ${
                    serviceType === 'dine_in'
                        ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                        : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span>Dine-In</span>
              </div>
            </button>
            <button
                type="button"
                onClick={() => setServiceType('take_away')}
                className={`flex-1 py-2 px-4 rounded-md border transition-colors duration-200 ${
                    serviceType === 'take_away'
                        ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                        : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Takeaway</span>
              </div>
            </button>
          </div>
        </div>

        {/* Customer Name */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>
            Customer Name
          </label>
          <input
              type="text"
              placeholder="Enter customer name (optional)"
              value={customerName}
              onChange={handleCustomerNameChange}
              onFocus={() => handleFocus('customerName')}
              onBlur={() => handleBlur('customerName')}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200 ${errors.customerName && errors.customerName.length > 0 ? 'border-[var(--error-color)] ring-1 ring-[var(--error-color)]' : 'border-[var(--border-color)]'}`}
              style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}
          />
          {renderFieldErrors('customerName')}
        </div>

        {/* Order Summary */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-color)' }}>Order Summary *</h3>
          {orderItems.length === 0 ? (
              <div
                  onClick={handleOrderItemsInteraction}
                  className="py-8 text-center bg-[var(--background-secondary)] rounded border border-dashed"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <p>No items added to the order</p>
                {renderFieldErrors('orderItems')}
              </div>
          ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium uppercase tracking-wider border-b pb-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}>
                  <div>Item</div>
                  <div className="text-center">Qty</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Total</div>
                  <div></div>
                </div>
                {orderItems.map((item, index) => (
                    <div key={item.product_id} className="grid grid-cols-5 gap-2 items-center py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="font-medium truncate" style={{ color: 'var(--text-color)' }}>
                        {item.product?.name || `Product ${item.product_id}`}
                      </div>
                      <div className="text-center" style={{ color: 'var(--text-color)' }}>{item.quantity}</div>
                      <div className="text-right" style={{ color: 'var(--text-color)' }}>
                        {formatPrice(item.product?.price || 0, activeCurrency)}
                      </div>
                      <div className="text-right font-medium" style={{ color: 'var(--text-color)' }}>
                        {formatPrice(item.sub_total || 0, activeCurrency)}
                      </div>
                      <div className="flex justify-end">
                        <button
                            onClick={() => {
                              handleOrderItemsInteraction();
                              setOrderItems(orderItems.filter((_, i) => i !== index));
                            }}
                            className="text-[var(--error-color)] hover:text-[var(--error-color-hover)] p-1 rounded-full hover:bg-[var(--surface-secondary)] transition-colors duration-200"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold" style={{ color: 'var(--text-color)' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                {formatPrice(totalAmount, activeCurrency)}
              </span>
                </div>
                {renderFieldErrors('orderItems')}
              </div>
          )}
        </div>

        {/* Dine-In Options */}
        {serviceType === 'dine_in' && (
            <div className="rounded-lg p-4 shadow-sm border flex gap-4" style={{ backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)' }}>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>
                  Table (Optional)
                </label>
                <select
                    value={selectedTableId || ''}
                    onChange={(e) => setSelectedTableId(e.target.value || null)}
                    className="w-full p-2 border rounded"
                    style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                >
                  <option value="">Select Table</option>
                  {freeTables.map((table) => (
                      <option key={table._id} value={table._id}>{table.number}</option>
                  ))}
                </select>
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>
                  Assign Waiter (Optional)
                </label>
                <select
                    value={waiterId || ''}
                    onChange={(e) => setWaiterId(e.target.value || null)}
                    className="w-full p-2 border rounded"
                    style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                >
                  <option value="">Select Waiter</option>
                  {freeWaiters.map((waiter) => (
                      <option key={waiter._id} value={waiter._id}>{waiter.name}</option>
                  ))}
                </select>
              </div>
            </div>
        )}

        {/* Payment Section for Takeaway */}
        {showPayment && (
            <div className="rounded-lg p-4 shadow-sm border space-y-4" style={{ backgroundColor: 'var(--background-color)', borderColor: 'var(--border-color)' }}>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>
                  Received Amount *
                </label>
                <input
                    type="number"
                    value={receivedAmount || ''}
                    onChange={handleReceivedAmountChange}
                    onFocus={() => handleFocus('receivedAmount')}
                    onBlur={() => handleBlur('receivedAmount')}
                    min={totalAmount}
                    step="0.01"
                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200 ${errors.receivedAmount && errors.receivedAmount.length > 0 ? 'border-[var(--error-color)] ring-1 ring-[var(--error-color)]' : 'border-[var(--border-color)]'}`}
                    style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}
                    placeholder={`Minimum: ${formatPrice(totalAmount, activeCurrency)}`}
                />
                {renderFieldErrors('receivedAmount')}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                  Payment Method *
                </label>
                <div className="flex gap-4">
                  <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('cash')}
                      className={`flex-1 py-2 px-4 rounded-md border transition-colors duration-200 ${
                          paymentMethod === 'cash'
                              ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                              : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
                      }`}
                      style={{ borderColor: 'var(--border-color)' }}
                  >
                    Cash
                  </button>
                  <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('card')}
                      className={`flex-1 py-2 px-4 rounded-md border transition-colors duration-200 ${
                          paymentMethod === 'card'
                              ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                              : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
                      }`}
                      style={{ borderColor: 'var(--border-color)' }}
                  >
                    Card
                  </button>
                </div>
                {renderFieldErrors('paymentMethod')}
              </div>
            </div>
        )}

        {/* Confirm Order Button */}
        <button
            onClick={handleEnhancedCreateOrder}
            disabled={isLoading.create || !isFormValid()}
            className={`flex items-center justify-center mx-auto px-8 py-4 text-lg font-medium rounded-lg transition-all duration-200 focus:outline-none w-3/4 min-w-[300px] max-w-[500px] ${
                isLoading.create || !isFormValid()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:brightness-90 hover:shadow-md'
            }`}
        >
          {isLoading.create ? (
              <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Order...
          </span>
          ) : (
              'Confirm Order'
          )}
        </button>

        {/* Action Buttons - Only show if order is created */}
        {createdOrder && (
            <div className="flex gap-4 mt-6">

            </div>
        )}
      </div>
  );
};

const OrderDetails = (props: OrderDetailsProps) => {
  return (
      <div className="relative space-y-3 p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
        <div className="lg:grid lg:grid-cols-10 lg:gap-6">
          <div className="lg:col-span-10">
            <div
                className="rounded-lg shadow-md border w-full mx-auto p-6"
                style={{
                  backgroundColor: 'var(--background-color)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
            >
              {props.isAddToOrder ? (
                  <AddToOrderForm {...props} />
              ) : (
                  <CreateOrderForm {...props} />
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default OrderDetails;