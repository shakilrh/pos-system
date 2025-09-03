import React, { useState, useEffect, useCallback } from 'react';
import {ChartBarIcon, XMarkIcon, PrinterIcon} from '@heroicons/react/24/outline';
import { Order, getOrderByNumber } from '../../services/orderService';
import toast from 'react-hot-toast';
import { OrderItem, ThemeColors, OrderDetailsProps } from './orderDetails';
import UserService from '../../services/UserService';
import { useAuth } from '../../context/AuthContext';
import {printReceipt} from "./printReceipt";

const ParentOrderCard: React.FC<{
  parentOrder: Order | null;
  themeColors: ThemeColors;
  activeCurrency: string;
}> = ({ parentOrder, themeColors, activeCurrency }) => {
  if (!parentOrder) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_paid': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceTypeIcon = (serviceType: string) => {
    return serviceType === 'dine_in' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    );
  };

  // Function to get currency symbol
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

  return (
      <div className="mb-4 relative">
        <div
            className="rounded-lg p-4 border shadow-sm h-64"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.cardBorder
            }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <div
                  className="rounded-full p-1"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--text-color-button)'
                  }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: themeColors.headingText }}>Parent Order Details</h3>
                <p className="text-sm" style={{ color: themeColors.cardText }}>Order #{parentOrder.order_number}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div
                    className="rounded-full p-1"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      color: 'var(--primary-color)'
                    }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: themeColors.cardText }}>Customer</p>
                  <p className="font-semibold" style={{ color: themeColors.headingText }}>{parentOrder.customer_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div
                    className="rounded-full p-1"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      color: 'var(--primary-color)'
                    }}
                >
                  {getServiceTypeIcon(parentOrder.service_type)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: themeColors.cardText }}>Service Type</p>
                  <p className="font-semibold" style={{ color: themeColors.headingText }}>
                    {parentOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                  </p>
                </div>
              </div>

              {parentOrder.table_id && (
                  <div className="flex items-center space-x-2">
                    <div
                        className="rounded-full p-1"
                        style={{
                          backgroundColor: 'var(--background-secondary)',
                          color: 'var(--primary-color)'
                        }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: themeColors.cardText }}>Table</p>
                      <p className="font-semibold" style={{ color: themeColors.headingText }}>{parentOrder.table_number || 'N/A'}</p>
                    </div>
                  </div>
              )}

              {parentOrder.waiter && (
                  <div className="flex items-center space-x-2">
                    <div
                        className="rounded-full p-1"
                        style={{
                          backgroundColor: 'var(--background-secondary)',
                          color: 'var(--primary-color)'
                        }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide" style={{ color: themeColors.cardText }}>Waiter</p>
                      <p className="font-semibold" style={{ color: themeColors.headingText }}>{parentOrder.waiter.name}</p>
                    </div>
                  </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div
                    className="rounded-full p-1"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      color: 'var(--primary-color)'
                    }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: themeColors.cardText }}>Total Amount</p>
                  <p className="font-bold text-xl" style={{ color: themeColors.headingText }} key={`parent-total-${activeCurrency}`}>
                    {formatPrice(parentOrder.total_amount, activeCurrency)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: themeColors.cardText }}>Order Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(parentOrder.status)}`}>
                  {parentOrder.status}
                </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1" style={{ color: themeColors.cardText }}>Payment Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(parentOrder.payment_status)}`}>
                  {parentOrder.payment_status.replace('_', ' ')}
                </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

interface StoreInfo {
  storeName: string;
  phoneNumber: string | null;
  address: string | null;
  store_logo?: string;
  logoUrl?: string;
}

const AddToOrderForm = ({
                          orderItems,
                          setOrderItems,
                          calculateTotalOrderAmount,
                          handleCreateOrder,
                          token,
                          logout,
                          setCustomerName,
                          setServiceType,
                          setSelectedTableId,
                          setWaiterId,
                          currentTheme,
                          createdOrder,
                          selectedTable,
                          selectedWaiter,
                          changeAmount = 0,
                        }: OrderDetailsProps) => {
  const { user } = useAuth();
  const [errors, setErrors] = useState<{
    parentOrderNumber?: string[];
    orderItems?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [parentOrderNumber, setParentOrderNumber] = useState<string>('');
  const [parentOrder, setParentOrder] = useState<Order | null>(null);
  const [activeCurrency, setActiveCurrency] = useState('pkr');
  const [isLoading, setIsLoading] = useState({
    create: false,
    fetchOrder: false
  });
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: 'POS Store',
    phoneNumber: null,
    address: null,
  });

  const getThemeColors = (theme?: string): ThemeColors => ({
    cardBackground: 'var(--background-color)',
    cardBorder: 'var(--border-color)',
    cardText: 'var(--text-color)',
    headingText: 'var(--heading-text)',
  });
  const themeColors = getThemeColors(currentTheme);

  // Function to get currency symbol
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

  // Function to get current currency
  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || storedCurrency || 'pkr';
  };

  // Fetch store information
  useEffect(() => {
    // Replace the fetchStoreData function in addToOrder.tsx with this version:

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
          store_logo: (response as any).store_logo || response.logoUrl,
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

  // Initialize and listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      console.log('AddToOrder: Received currency change event:', event.detail);
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== activeCurrency) {
        setActiveCurrency(newCurrency);
        console.log('AddToOrder: Currency updated to:', newCurrency);
      }
    };

    const handleSettingsLoaded = (event: CustomEvent) => {
      console.log('AddToOrder: Received settings loaded event:', event.detail);
      const newCurrency = event.detail.currency;
      if (newCurrency) {
        setActiveCurrency(newCurrency);
        console.log('AddToOrder: Currency loaded as:', newCurrency);
      }
    };

    const handleForceRerender = (event: CustomEvent) => {
      console.log('AddToOrder: Received force rerender event:', event.detail);
      if (event.detail.type === 'currency') {
        const newCurrency = event.detail.value;
        setActiveCurrency(newCurrency);
        console.log('AddToOrder: Currency force updated to:', newCurrency);
      }
    };

    // Add event listeners
    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    // Initial currency check
    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      console.log('AddToOrder: Setting initial currency to:', initialCurrency);
      setActiveCurrency(initialCurrency);
    }

    // Cleanup
    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency]);

  // Debug logging
  useEffect(() => {
    console.log('AddToOrder: Active currency is now:', activeCurrency);
    console.log('AddToOrder: Currency symbol:', getCurrencySymbol(activeCurrency));
  }, [activeCurrency]);

  const totalAmount = calculateTotalOrderAmount();

  // Debounced function to fetch parent order
  const debouncedFetchParentOrder = useCallback(
      (() => {
        let timeoutId: NodeJS.Timeout;

        return (orderNumber: string) => {
          clearTimeout(timeoutId);

          if (!orderNumber.trim()) {
            setParentOrder(null);
            setErrors(prev => ({
              ...prev,
              parentOrderNumber: []
            }));
            return;
          }

          timeoutId = setTimeout(async () => {
            if (!token) return;

            setIsLoading(prev => ({ ...prev, fetchOrder: true }));

            try {
              const order = await getOrderByNumber(token, logout, orderNumber);
              setParentOrder(order);
              setCustomerName(order.customer_name || '');
              setServiceType(order.service_type || 'dine_in');
              setSelectedTableId(order.table_id || null);
              setWaiterId(order.waiter_id || null);
              setErrors(prev => ({
                ...prev,
                parentOrderNumber: [],
              }));
              toast.success('Parent order details loaded successfully');
            } catch (error) {
              setParentOrder(null);
              const message = error instanceof Error ? error.message : 'Failed to fetch parent order';
              setErrors(prev => ({
                ...prev,
                parentOrderNumber: [message],
              }));
              console.error('Failed to fetch parent order:', message);
            } finally {
              setIsLoading(prev => ({ ...prev, fetchOrder: false }));
            }
          }, 800); // 800ms debounce delay
        };
      })(),
      [token, logout, setCustomerName, setServiceType, setSelectedTableId, setWaiterId]
  );

  const validateParentOrderNumber = (orderNumber: string): string[] => {
    const errors: string[] = [];
    if (!orderNumber) {
      errors.push('Parent order number is required');
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
      case 'parentOrderNumber':
        return validateParentOrderNumber(parentOrderNumber);
      case 'orderItems':
        return validateOrderItems(orderItems);
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    const orderItemsValid = validateOrderItems(orderItems).length === 0;
    const parentOrderNumberValid = validateParentOrderNumber(parentOrderNumber).length === 0;
    const hasParentOrder = parentOrder !== null;
    return orderItemsValid && parentOrderNumberValid && hasParentOrder;
  };

  const handleParentOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setParentOrderNumber(value);

    // Trigger debounced fetch
    debouncedFetchParentOrder(value);

    if (touchedFields.has('parentOrderNumber')) {
      setErrors(prev => ({
        ...prev,
        parentOrderNumber: validateParentOrderNumber(value)
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
    if (parentOrder?.service_type === 'take_away') {
      setErrors(prev => ({
        ...prev,
        receivedAmount: [],
        paymentMethod: []
      }));
      setTouchedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete('receivedAmount');
        newSet.delete('paymentMethod');
        return newSet;
      });
    }
  }, [parentOrder]);

  const handleEnhancedCreateOrder = async () => {
    const fieldsToValidate = ['orderItems', 'parentOrderNumber'];
    setTouchedFields(new Set(fieldsToValidate));

    const allErrors: any = {};
    allErrors.orderItems = validateOrderItems(orderItems);
    allErrors.parentOrderNumber = validateParentOrderNumber(parentOrderNumber);

    setErrors(allErrors);

    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);

    if (!hasErrors && parentOrder) {
      setIsLoading(prev => ({ ...prev, create: true }));

      try {
        const orderData = {
          order_items: orderItems,
          parent_order_number: parentOrderNumber,
          customer_name: parentOrder.customer_name,
          service_type: parentOrder.service_type,
          ...(parentOrder.service_type === 'take_away' && {
            payment_method: parentOrder.payment_method,
            received_amount: parentOrder.received_amount,
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
        setIsLoading(prev => ({ ...prev, create: false }));
      }
    }
  };

  const handleOrderItemsInteraction = () => {
    setTouchedFields(prev => new Set(prev).add('orderItems'));
  };

  // Replace the handleDirectPrint function in addToOrder.tsx with this version:

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
      paymentMethod: parentOrder?.payment_method || 'cash', // Use parent order's payment method
      formatPrice,
    });
  };

  // Clear order function

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
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Add to Order</h3>
          </div>
        </div>

        {/* Parent Order Number Input */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-color)' }}>
            Parent Order Number *
          </label>
          <div className="relative">
            <input
                type="text"
                placeholder="Enter parent order number (e.g., 1707-RPOS-002)"
                value={parentOrderNumber}
                onChange={handleParentOrderNumberChange}
                onFocus={() => handleFocus('parentOrderNumber')}
                onBlur={() => handleBlur('parentOrderNumber')}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200 ${errors.parentOrderNumber && errors.parentOrderNumber.length > 0 ? 'border-[var(--error-color)] ring-1 ring-[var(--error-color)]' : 'border-[var(--border-color)]'}`}
                style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }}
                disabled={isLoading.fetchOrder}
            />
            {isLoading.fetchOrder && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-[var(--primary-color)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
            )}
          </div>
          {renderFieldErrors('parentOrderNumber')}
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
                      <div className="text-right" style={{ color: 'var(--text-color)' }} key={`item-price-${item.product_id}-${activeCurrency}`}>
                        {formatPrice(item.product?.price || 0, activeCurrency)}
                      </div>
                      <div className="text-right font-medium" style={{ color: 'var(--text-color)' }} key={`item-total-${item.product_id}-${activeCurrency}`}>
                        {formatPrice(item.sub_total || 0, activeCurrency)}
                      </div>
                      <div className="flex justify-end">
                        <button
                            onClick={() => {
                              handleOrderItemsInteraction();
                              setOrderItems(orderItems.filter((_, i) => i !== index));
                            }}
                            className="text-[var(--error-color)] hover:text-[var(--error-color-hover)] p-1 rounded-full hover:bg-[var(--background-secondary)]"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold" style={{ color: 'var(--text-color)' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--text-color)' }} key={`total-${activeCurrency}`}>
                {formatPrice(totalAmount, activeCurrency)}
              </span>
                </div>
                {renderFieldErrors('orderItems')}
              </div>
          )}
        </div>

        {/* Parent Order Card */}
        <ParentOrderCard parentOrder={parentOrder} themeColors={themeColors} activeCurrency={activeCurrency} />

        {/* Add to Order Button */}
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
            Adding to Order...
          </span>
          ) : (
              'Add to Order'
          )}
        </button>

        {/* Action Buttons - Only show if order is created */}

      </div>
  );
};

export default AddToOrderForm;