import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import { processPayment, markOrderAsCompleted } from '../../services/orderService';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/UserService';

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

interface StoreInfo {
  storeName: string;
  phoneNumber: string | null;
  address: string | null;
  store_logo?: string;
  logoUrl?: string;
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
    const matchesSearch =
        searchTerm &&
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
              {searchTerm ? 'No orders found' : ''}
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
  const { user } = useAuth();
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: 'POS Store',
    phoneNumber: null,
    address: null,
  });
  const [isLoadingStore, setIsLoadingStore] = useState(false);

  const calculateTotalFromItems = (orderItems: any[]) => {
    if (!orderItems || orderItems.length === 0) return 0;
    return orderItems.reduce((total, item) => {
      const itemTotal = item.sub_total || (item.product?.price || 0) * (item.quantity || 0);
      return total + itemTotal;
    }, 0);
  };

  const getOrderTotal = (orderData: Order) => {
    return orderData.combined_total_amount ||
        orderData.total_amount ||
        calculateTotalFromItems(orderData.items || []);
  };

  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
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

    console.log('PaymentModal - Order data:', {
      combined_total_amount: order.combined_total_amount,
      total_amount: order.total_amount,
      calculated_total: calculateTotalFromItems(order.items || []),
      final_total: total,
      items: order.items
    });
  }, [order]);

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

      setIsLoadingStore(true);
      try {
        console.log('PaymentModal: Fetching store details with token:', token);
        const response = await UserService.getUserDetails(token);
        console.log('PaymentModal: Store details response:', response);

        setStoreInfo({
          storeName: response.store_name || response.name || 'POS Store',
          phoneNumber: (response as any).phone_number || null,
          address: (response as any).address || null,
          store_logo: response.store_logo || response.logoUrl,
        });
      } catch (err) {
        console.error('PaymentModal: Fetch store data error:', err);
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: (user as any)?.phone_number || null,
          address: (user as any)?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
      } finally {
        setIsLoadingStore(false);
      }
    };

    fetchStoreData();
  }, [token, user]);

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

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const storeName = storeInfo.storeName;
    const storePhone = storeInfo.phoneNumber;
    const storeAddress = storeInfo.address;
    const tableNumber = currentOrder.table_number || '';
    const storeLogo = storeInfo.store_logo || storeInfo.logoUrl;

    printWindow.document.write(`
<html>
<head>
<title>Receipt - Order #${currentOrder.order_number}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --background-color: #ffffff;
    --surface-color: #ffffff;
    --text-color: #1a202c;
    --text-secondary: #4a5568;
    --border-color: #e2e8f0;
    --focus-ring: #3182ce;
    --error-color: #e53e3e;
    --background-secondary: #edf2f7;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, monospace, sans-serif;
    margin: 0;
    padding: 6px;
    font-size: 10px;
    line-height: 1.2;
    color: var(--text-color);
    background: var(--background-color);
  }

  .receipt-container {
    max-width: 72mm;
    margin: 0 auto;
    background: var(--surface-color);
    padding: 6px;
    border: 1px solid var(--border-color);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-color);
    gap: 8px;
  }

  .store-logo {
    width: 35px;
    height: 35px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .store-name {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    color: var(--text-color);
  }

  .order-header {
    text-align: center;
    margin: 6px 0;
    font-weight: 700;
    font-size: 12px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
  }

  .order-details {
    font-size: 9px;
    margin: 6px 0;
    line-height: 1.2;
    color: var(--text-secondary);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin: 1px 0;
    padding: 1px 0;
  }

  .detail-row span:first-child {
    font-weight: 600;
  }

  .completion-time {
    text-align: center;
    font-weight: 700;
    margin: 6px 0;
    font-size: 9px;
    border: 1px solid var(--border-color);
    padding: 4px;
    background: var(--background-secondary);
  }

  .items-section {
    margin: 6px 0;
    padding-bottom: 3px;
  }

  .items-header {
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 3px;
    padding-bottom: 2px;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }

  .items-table th {
    padding: 2px;
    text-align: left;
    font-weight: 700;
    color: var(--text-color);
  }

  .items-table td {
    padding: 2px;
    vertical-align: top;
    color: var(--text-secondary);
  }

  .item-name {
    max-width: 100px;
    word-wrap: break-word;
  }

  .item-center {
    text-align: center;
    width: 25px;
  }

  .item-right {
    text-align: right;
    width: 40px;
  }

  .total-section {
    margin: 6px 0;
    padding-top: 3px;
    border-top: 1px solid var(--border-color);
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin: 1px 0;
    font-size: 10px;
    padding: 1px 0;
    color: var(--text-color);
  }

  .total-row.grand-total {
    font-weight: 700;
    font-size: 12px;
    border-top: 1px solid var(--border-color);
    padding-top: 3px;
    margin-top: 3px;
  }

  .payment-info {
    text-align: center;
    font-size: 9px;
    margin: 4px 0;
    font-weight: 700;
    border: 1px solid var(--border-color);
    padding: 3px;
    background: var(--background-secondary);
    color: var(--text-color);
  }

  .thank-you {
    text-align: center;
    font-weight: 700;
    font-size: 10px;
    margin: 8px 0;
    text-transform: uppercase;
    color: var(--text-color);
  }

  .footer {
    text-align: center;
    font-size: 8px;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .store-contact {
    font-size: 8px;
    margin-top: 3px;
    line-height: 1.2;
  }

  .divider {
    text-align: center;
    margin: 6px 0;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-color);
  }

  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    .receipt-container {
      max-width: none;
      width: 100%;
    }
  }
</style>
</head>
<body>
<div class="receipt-container">
  <div class="header">
    ${storeLogo ? `<img src="${storeLogo}" class="store-logo" alt="Store Logo" />` : ''}
    <div class="store-name">${storeName}</div>
  </div>

  <div class="order-header">
    ORDER #${currentOrder.order_number}
  </div>

  <div class="order-details">
    <div class="detail-row">
      <span>Date:</span>
      <span>${new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Karachi',
    })}</span>
    </div>
    <div class="detail-row">
      <span>Customer:</span>
      <span>${currentOrder.customer_name}</span>
    </div>
    <div class="detail-row">
      <span>Type:</span>
      <span>${currentOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
    </div>
    ${currentOrder.service_type === 'dine_in' && tableNumber ? `
    <div class="detail-row">
      <span>Table:</span>
      <span>${tableNumber}</span>
    </div>` : ''}
    ${currentOrder.payment_status === 'paid' ? `
    <div class="detail-row">
      <span>Payment:</span>
      <span>${paymentMethod.toUpperCase()}</span>
    </div>` : ''}
  </div>

  ${currentOrder.estimated_completion ? `
  <div class="completion-time">
    ESTIMATED COMPLETION: ${currentOrder.estimated_completion}
  </div>` : ''}

  <div class="divider">----------</div>

  <div class="items-section">
    <table class="items-table">
      <thead>
        <tr class="items-header">
          <th class="item-name">Item</th>
          <th class="item-center">Qty</th>
          <th class="item-right">Price</th>
          <th class="item-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${currentOrder.items.map(item => `
          <tr>
            <td class="item-name">${item.product_id?.name || 'Unknown Item'}</td>
            <td class="item-center">${item.quantity}</td>
            <td class="item-right">${formatPrice(item.product_id?.price || 0, activeCurrency)}</td>
             <td class="item-right">${formatPrice(item.sub_total || 0, activeCurrency)}</td>

          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-row grand-total">
      <span>TOTAL</span>
      <span>${formatPrice(orderTotal || 0, activeCurrency)}</span>
    </div>
    ${changeAmount > 0 && currentOrder.payment_status === 'paid' ? `
    <div class="total-row">
      <span>Change Given:</span>
      <span>${formatPrice(changeAmount, activeCurrency)}</span>
    </div>` : ''}
  </div>

  ${currentOrder.payment_status === 'paid' ? `
  <div class="payment-info">
    PAYMENT CONFIRMED ✓
  </div>` : ''}

  <div class="thank-you">
    THANK YOU!
  </div>

  <div class="footer">
    <div>${new Date().toLocaleDateString()} | ${storeName}</div>
    ${(storeAddress || storePhone) ? `
    <div class="store-contact">
      ${storeAddress ? `${storeAddress}` : ''}
      ${storeAddress && storePhone ? '<br/>' : ''}
      ${storePhone ? `Tel: ${storePhone}` : ''}
    </div>` : ''}
  </div>
</div>
</body>
</html>
`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
      <>
        {isLoadingStore ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="rounded-lg p-6 max-w-sm w-full mx-4" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--text-color)] mx-auto mb-3"></div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading store information...</p>
                </div>
              </div>
            </div>
        ) : (
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
                                  <span className="font-medium truncate block">{item.product_id?.name || 'Unknown'}</span>
                                </div>
                                <div className="text-right ml-2">
                                  <div className="font-medium">x{item.quantity || 0}</div>
                                  <div className="text-[var(--text-secondary)] text-xs">
                                    {formatPrice(
                                        item.sub_total || (item.product_id?.price || 0) * (item.quantity || 0),
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
                        <div className="flex gap-2">
                          <button
                              onClick={handlePrintReceipt}
                              className="flex-1 py-3 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors shadow-md flex items-center justify-center gap-2"
                          >
                            <PrinterIcon className="w-5 h-5" />
                            Print Receipt
                          </button>
                          <button
                              onClick={handleMarkAsCompleted}
                              disabled={isProcessing}
                              className="flex-1 py-3 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors shadow-md"
                          >
                            {isProcessing ? '⏳ Processing...' : 'Mark as Completed'}
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </>
  );
};

export default PaymentModal;
export { OrderSearch };