import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import { processPayment, markOrderAsCompleted } from '../../services/orderService';
import ReceiptModal from './ReceiptModal';

interface PaymentModalProps {
  order: Order;
  token: string | null;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orders: Order[];
  setMessage: (message: string) => void;
  currentCurrency?: string;
}

interface OrderSearchProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  style?: React.CSSProperties;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
                                                   orders,
                                                   onOrderSelect,
                                                   searchTerm,
                                                   setSearchTerm,
                                                   statusFilter,
                                                   style,
                                                 }) => {
  const [activeCurrency, setActiveCurrency] = useState('pkr');

  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      pkr: '₨',
      dollar: '$',
      euro: '€',
    };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
  };

  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || storedCurrency || 'pkr';
  };

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

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    // Only include orders if searchTerm is non-empty and matches criteria
    const matchesSearch =
        searchTerm && // Only filter if searchTerm is not empty
        (
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.order_number.toString().includes(searchTerm) ||
            order._id?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return matchesStatus && matchesSearch;
  });

  return (
      <div className="space-y-2" style={style}>
        <div className="relative">
          <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, order number, or ID..."
              className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent bg-[var(--background-color)] text-[var(--text-color)]"
          />
          <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
            />
          </svg>
        </div>
        {searchTerm && filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
                <div
                    key={order._id}
                    onClick={() => onOrderSelect(order)}
                    className="p-2 bg-[var(--background-secondary)] rounded-lg cursor-pointer hover:bg-[var(--background-hover)] transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">#{order.order_number}</span>
                      <span className="text-sm text-[var(--text-secondary)] ml-2">
                  {order.customer_name || 'Guest'}
                </span>
                    </div>
                    <span className="text-sm font-medium">
                {formatPrice(order.combined_total_amount || order.total_amount || 0, activeCurrency)}
              </span>
                  </div>
                </div>
            ))
        ) : (
            <div className="text-sm text-[var(--text-secondary)] text-center py-2">
              {searchTerm ? 'No orders found':''}
            </div>
        )}
      </div>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({
                                                     order,
                                                     token,
                                                     logout,
                                                     onClose,
                                                     setOrders,
                                                     orders,
                                                     setMessage,
                                                     currentCurrency = 'pkr',
                                                   }) => {
  // Calculate total amount dynamically from items if combined_total_amount is not available
  const calculateTotalFromItems = (orderItems: any[]) => {
    if (!orderItems || orderItems.length === 0) return 0;
    return orderItems.reduce((total, item) => {
      const itemTotal = item.sub_total || (item.product?.price || 0) * (item.quantity || 0);
      return total + itemTotal;
    }, 0);
  };

  // Get the most accurate total amount available
  const getOrderTotal = (orderData: Order) => {
    // Priority: combined_total_amount > total_amount > calculated from items
    return orderData.combined_total_amount ||
        orderData.total_amount ||
        calculateTotalFromItems(orderData.items || []);
  };

  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [activeCurrency, setActiveCurrency] = useState(currentCurrency);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      pkr: '₨',
      dollar: '$',
      euro: '€',
    };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
  };

  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || currentCurrency || storedCurrency || 'pkr';
  };

  useEffect(() => {
    setActiveCurrency(currentCurrency);
  }, [currentCurrency]);

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

  useEffect(() => {
    setCurrentOrder(order);
    const total = getOrderTotal(order);
    setOrderTotal(total);
    setReceivedAmount(total.toString());

    // Debug logging to help identify the issue
    console.log('PaymentModal - Order data:', {
      combined_total_amount: order.combined_total_amount,
      total_amount: order.total_amount,
      calculated_total: calculateTotalFromItems(order.items || []),
      final_total: total,
      items: order.items
    });
  }, [order]);

  const calculateChange = () => {
    const amount = parseFloat(receivedAmount);
    return isNaN(amount) ? 0 : Math.max(0, amount - orderTotal);
  };

  const handlePaymentProcess = async () => {
    if (!token) {
      setMessage('Please log in.');
      return;
    }

    const amount = parseFloat(receivedAmount);

    if (isNaN(amount) || amount <= 0) {
      setMessage('Invalid payment amount.');
      return;
    }

    if (amount < orderTotal) {
      setMessage(`Payment amount too low. Required: ${formatPrice(orderTotal, activeCurrency)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const updatedOrder = await processPayment(token, logout, currentOrder._id, amount, paymentMethod);
      const newOrder = {
        ...updatedOrder,
        items: currentOrder.items,
        payment_status: 'paid',
        // Ensure the total amount is preserved
        combined_total_amount: orderTotal,
        total_amount: orderTotal
      };
      setCurrentOrder(newOrder);
      const change = calculateChange();
      setChangeAmount(change);
      setOrders((prevOrders) =>
          prevOrders.map((o) =>
              o.order_number === updatedOrder.order_number ? newOrder : o
          )
      );
      setMessage(`Payment of ${formatPrice(orderTotal, activeCurrency)} processed successfully for Order #${currentOrder.order_number}`);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Payment processing error:', error);
      setMessage(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!token) {
      setMessage('Please log in.');
      return;
    }

    setIsProcessing(true);

    try {
      const updatedOrder = await markOrderAsCompleted(token, logout, currentOrder.order_number);
      setOrders((prevOrders) =>
          prevOrders.map((o) =>
              o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
          )
      );
      setMessage(`Order #${currentOrder.order_number} marked as completed!`);
      onClose();
    } catch (error) {
      console.error('Mark as completed error:', error);
      setMessage(`Failed to mark as completed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    setCurrentOrder((prev) => ({ ...prev }));
  };

  return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-[var(--background-color)] rounded-lg w-full max-w-xs">
            <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text-color)]">#{currentOrder.order_number}</h2>
                <div className="text-sm text-[var(--text-secondary)] space-y-0.5">
                  <p>👤 {currentOrder.customer_name || 'Guest'}</p>
                  <p>{currentOrder.service_type === 'dine_in' ? '🍽️' : '🥡'} {currentOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
                  {currentOrder.table_number && <p>Table: {currentOrder.table_number}</p>}
                  <p className="text-[var(--text-secondary)] capitalize">{currentOrder.payment_status.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-[var(--background-secondary)] rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 space-y-3">
              {currentOrder.linked_orders && currentOrder.linked_orders.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-[var(--text-color)]">Linked Orders:</h3>
                    <div className="flex flex-wrap gap-1">
                      {currentOrder.linked_orders.map((linkedOrder, index) => (
                          <span
                              key={index}
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: index % 2 === 0 ? 'var(--warning-light)' : 'var(--success-light)',
                                color: 'var(--text-color)',
                              }}
                          >
                      Order #{linkedOrder}
                    </span>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Total includes amounts from linked orders.
                    </p>
                  </div>
              )}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-[var(--text-color)]">Items:</h3>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {currentOrder.items && currentOrder.items.length > 0 ? (
                      currentOrder.items.map((item, index) => (
                          <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-[var(--background-secondary)] rounded text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium truncate block">{item.product?.name || 'Unknown'}</span>
                            </div>
                            <div className="text-right ml-2">
                              <div className="font-medium">x{item.quantity || 0}</div>
                              <div className="text-[var(--text-secondary)] text-xs">
                                {formatPrice(
                                    item.sub_total || (item.product?.price || 0) * (item.quantity || 0),
                                    activeCurrency
                                )}
                              </div>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-sm text-[var(--text-secondary)] text-center py-2">No items</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-[var(--text-color)]">
                <span>Total:</span>
                <span>{formatPrice(orderTotal, activeCurrency)}</span>
              </div>

              {/* Debug info - remove this in production */}
              <div className="text-xs text-[var(--text-tertiary)] bg-[var(--background-secondary)] p-2 rounded">
                Debug: Combined: {currentOrder.combined_total_amount} | Total: {currentOrder.total_amount} | Calculated: {orderTotal}
              </div>

              {currentOrder.payment_status === 'not_paid' ? (
                  <div className="space-y-3 border-t pt-3 border-[var(--border-color)]">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-color)] mb-2">Payment Method:</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center text-sm cursor-pointer">
                          <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'cash'}
                              onChange={() => setPaymentMethod('cash')}
                              className="mr-2 w-4 h-4 text-green-600 border-[var(--border-color)] rounded focus:ring-green-500"
                          />
                          💵 Cash
                        </label>
                        <label className="flex items-center text-sm cursor-pointer">
                          <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'card'}
                              onChange={() => setPaymentMethod('card')}
                              className="mr-2 w-4 h-4 text-blue-600 border-[var(--border-color)] rounded focus:ring-blue-500"
                          />
                          💳 Card
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-color)] mb-1">Amount Received:</label>
                      <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent bg-[var(--background-color)] text-[var(--text-color)]"
                          placeholder="Enter amount received"
                      />
                    </div>

                    {paymentMethod === 'cash' && parseFloat(receivedAmount) > orderTotal && (
                        <div className="p-3 bg-[var(--success-light)] border border-[var(--success-border)] rounded-lg">
                          <div className="text-sm font-medium text-[var(--text-success)]">
                            💰 Change: {formatPrice(calculateChange(), activeCurrency)}
                          </div>
                        </div>
                    )}

                    <button
                        onClick={handlePaymentProcess}
                        disabled={isProcessing || !receivedAmount || parseFloat(receivedAmount) < orderTotal}
                        className="w-full py-3 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                      {isProcessing ? '⏳ Processing...' : 'Process Payment'}
                    </button>
                  </div>
              ) : (
                  <div className="space-y-3 border-t pt-3 border-[var(--border-color)]">
                    <div className="text-center p-3 bg-[var(--success-light)] border border-[var(--success-border)] rounded-lg">
                      <h3 className="text-sm font-semibold text-[var(--text-success)]">✅ Payment Processed!</h3>
                      <p className="text-sm text-[var(--text-success)]">Ready for completion</p>
                    </div>
                    <button
                        onClick={handleMarkAsCompleted}
                        disabled={isProcessing}
                        className="w-full py-3 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors shadow-md"
                    >
                      {isProcessing ? '⏳ Processing...' : 'Mark as Completed'}
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>

        {showReceiptModal && (
            <ReceiptModal
                order={currentOrder}
                changeAmount={changeAmount}
                onPrint={() => {}}
                onClose={handleReceiptClose}
                autoClose={true}
                autoCloseDelay={3000}
                showButtons={true}
                title="Payment Confirmed"
                paymentMethod={paymentMethod}
                selectedTable={{ number: currentOrder.table_number }}
                currentCurrency={activeCurrency}
            />
        )}
      </>
  );
};

export default PaymentModal;
export { OrderSearch };