import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Order, getOrderByNumber } from '../../services/orderService';
import toast from 'react-hot-toast';
import { OrderItem, ThemeColors, OrderDetailsProps } from './orderDetails';

const ParentOrderCard: React.FC<{
  parentOrder: Order | null;
  themeColors: ThemeColors;
}> = ({ parentOrder, themeColors }) => {
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

  return (
    <div className="mb-4 relative">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-md h-64">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-500 text-white rounded-full p-1">
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
              <div className="bg-purple-100 text-purple-600 rounded-full p-1">
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
              <div className="bg-green-100 text-green-600 rounded-full p-1">
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
                <div className="bg-orange-100 text-orange-600 rounded-full p-1">
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
                <div className="bg-indigo-100 text-indigo-600 rounded-full p-1">
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
              <div className="bg-emerald-100 text-emerald-600 rounded-full p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: themeColors.cardText }}>Total Amount</p>
                <p className="font-bold text-xl" style={{ color: themeColors.headingText }}>${parentOrder.total_amount.toFixed(2)}</p>
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
                        }: OrderDetailsProps) => {
  const [errors, setErrors] = useState<{
    parentOrderNumber?: string[];
    orderItems?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [parentOrderNumber, setParentOrderNumber] = useState<string>('');
  const [parentOrder, setParentOrder] = useState<Order | null>(null);
  const getThemeColors = (theme?: string): ThemeColors => ({
    cardBackground: 'var(--background-color)',
    cardBorder: 'var(--border-color)',
    cardText: 'var(--text-color)',
    headingText: 'var(--heading-text)',
  });
  const themeColors = getThemeColors(currentTheme);

  const totalAmount = calculateTotalOrderAmount();

  const validateParentOrderNumber = async (orderNumber: string): Promise<string[]> => {
    const errors: string[] = [];
    if (!orderNumber) {
      errors.push('Parent order number is required');
    } else {
      try {
        const order = await getOrderByNumber(token!, logout, orderNumber);
        setParentOrder(order);
        setCustomerName(order.customer_name || '');
        setServiceType(order.service_type || 'dine_in');
        setSelectedTableId(order.table_id || null);
        setWaiterId(order.waiter_id || null);
      } catch (error) {
        setParentOrder(null);
        errors.push('Invalid parent order number');
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

  const getFieldErrors = (fieldName: string): string[] | Promise<string[]> => {
    switch (fieldName) {
      case 'parentOrderNumber':
        return validateParentOrderNumber(parentOrderNumber);
      case 'orderItems':
        return validateOrderItems(orderItems);
      default:
        return [];
    }
  };

  const isFormValid = async (): Promise<boolean> => {
    const orderItemsValid = validateOrderItems(orderItems).length === 0;
    const parentOrderNumberValid = (await validateParentOrderNumber(parentOrderNumber)).length === 0;
    return orderItemsValid && parentOrderNumberValid;
  };

  const handleParentOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setParentOrderNumber(value);

    if (touchedFields.has('parentOrderNumber')) {
      validateParentOrderNumber(value).then(errors => {
        setErrors(prev => ({
          ...prev,
          parentOrderNumber: errors
        }));
      });
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    if (fieldName === 'parentOrderNumber') {
      validateParentOrderNumber(parentOrderNumber).then(errors => {
        setErrors(prev => ({
          ...prev,
          parentOrderNumber: errors
        }));
      });
    } else {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName) as string[]
      }));
    }
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has('parentOrderNumber')) {
      validateParentOrderNumber(parentOrderNumber).then(errors => {
        setErrors(prev => ({
          ...prev,
          parentOrderNumber: errors
        }));
      });
    } else {
      setErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName) as string[]
      }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchParentOrder = async () => {
      if (parentOrderNumber && token) {
        try {
          const order = await getOrderByNumber(token, logout, parentOrderNumber);
          if (isMounted) {
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
          }
        } catch (error) {
          if (isMounted) {
            setParentOrder(null);
            const message = error instanceof Error ? error.message : 'Failed to fetch parent order';
            setErrors(prev => ({
              ...prev,
              parentOrderNumber: [message],
            }));
            toast.error(message);
          }
        }
      } else {
        setParentOrder(null);
      }
    };

    fetchParentOrder();

    return () => {
      isMounted = false;
    };
  }, [parentOrderNumber, token, logout, setCustomerName, setServiceType, setSelectedTableId, setWaiterId]);

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
    allErrors.parentOrderNumber = await validateParentOrderNumber(parentOrderNumber);

    setErrors(allErrors);

    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);

    if (!hasErrors && parentOrder) {
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
      }
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
    <div className="space-y-6" style={{ backgroundColor: themeColors.cardBackground, color: themeColors.cardText, border: `1px solid ${themeColors.cardBorder}` }}>
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: themeColors.cardText }}>
          Parent Order Number *
        </label>
        <input
          type="text"
          placeholder="Enter parent order number (e.g., 1707-RPOS-002)"
          value={parentOrderNumber}
          onChange={handleParentOrderNumberChange}
          onFocus={() => handleFocus('parentOrderNumber')}
          onBlur={() => handleBlur('parentOrderNumber')}
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200 ${errors.parentOrderNumber && errors.parentOrderNumber.length > 0 ? 'border-[var(--error-color)] ring-1 ring-[var(--error-color)]' : 'border-[var(--border-color)]'}`}
          style={{ backgroundColor: themeColors.cardBackground, color: themeColors.cardText }}
        />
        {renderFieldErrors('parentOrderNumber')}
      </div>

      <div>
        <h3 className="font-semibold mb-4" style={{ color: themeColors.headingText }}>Order Summary</h3>
        {orderItems.length === 0 ? (
          <div onClick={handleOrderItemsInteraction}>
            <p style={{ color: themeColors.cardText }}>No items added to the order</p>
            {renderFieldErrors('orderItems')}
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="border-b" style={{ borderColor: themeColors.cardBorder }}>
                <th className="py-2 px-4" style={{ color: themeColors.cardText }}>Item</th>
                <th className="py-2 px clara-4" style={{ color: themeColors.cardText }}>Qty</th>
                <th className="py-2 px-4" style={{ color: themeColors.cardText }}>Price</th>
                <th className="py-2 px-4" style={{ color: themeColors.cardText }}>Total</th>
                <th className="py-2 px-4" style={{ color: themeColors.cardText }}>Action</th>
              </tr>
              </thead>
              <tbody>
              {orderItems.map((item, index) => (
                <tr key={item.product_id} className="border-b" style={{ borderColor: themeColors.cardBorder }}>
                  <td className="py-2 px-4" style={{ color: themeColors.cardText }}>{item.product?.name || `Product ${item.product_id}`}</td>
                  <td className="py-2 px-4" style={{ color: themeColors.cardText }}>{item.quantity}</td>
                  <td className="py-2 px-4" style={{ color: themeColors.cardText }}>${(item.product?.price || 0).toFixed(2)}</td>
                  <td className="py-2 px-4" style={{ color: themeColors.cardText }}>${(item.sub_total || 0).toFixed(2)}</td>
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
                <td colSpan={3} className="py-2 px-4 text-right" style={{ color: themeColors.cardText }}>Total</td>
                <td className="py-2 px-4" style={{ color: themeColors.cardText }}>${totalAmount.toFixed(2)}</td>
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
        disabled={false}
        className={`w-full py-2 rounded-lg transition-all duration-200 ${!isFormValid() ? 'bg-[var(--background-secondary)] text-[var(--text-secondary)] cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-color-button)] hover:bg-[var(--primary-color)]'}`}
      >
        Add to Order
      </button>

      <ParentOrderCard parentOrder={parentOrder} themeColors={themeColors} />
    </div>
  );
};

export default AddToOrderForm;
