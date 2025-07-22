import React, { useEffect, useState } from 'react';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/UserService';

interface Product {
  _id?: string;
  name: string;
  price: number;
  category_id?: string;
  categoryName?: string;
  description?: string;
  pictureUrl?: string | null;
  displayPrice?: string;
  isActive?: boolean;
  time_required?: number;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  product?: Product;
  sub_total?: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  order_type: string;
  customer_name: string;
  service_type: 'dine_in' | 'take_away';
  total_amount: number;
  order_number: string;
  createdAt: string;
  status: string;
  payment_status: string;
  estimated_completion?: string;
  table_id?: string;
  waiter_id?: string;
}

interface Waiter {
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

interface StoreInfo {
  storeName: string;
  phoneNumber: string | null;
  address: string | null;
  store_logo?: string;
  logoUrl?: string;
}

interface ReceiptModalProps {
  order: Order;
  changeAmount?: number;
  onPrint: () => void;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showButtons?: boolean;
  title?: string;
  paymentMethod?: string;
  selectedTable?: any;
  selectedWaiter?: Waiter | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
                                                     order,
                                                     changeAmount = 0,
                                                     onPrint,
                                                     onClose,
                                                     autoClose = false,
                                                     autoCloseDelay = 3000,
                                                     showButtons = true,
                                                     title = 'Order Confirmed',
                                                     paymentMethod,
                                                     selectedTable,
                                                     selectedWaiter,
                                                   }) => {
  const printRef = React.useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();

  // Store information state
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: 'POS Store',
    phoneNumber: null,
    address: null,
  });
  const [isLoadingStore, setIsLoadingStore] = useState(false);

  const isPaymentProcessed = order.payment_status === 'paid';
  const shouldShowPaymentMethod = paymentMethod && isPaymentProcessed;

  // Fetch store information
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!token) {
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: user?.phone_number || null,
          address: user?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
        return;
      }

      setIsLoadingStore(true);
      try {
        console.log('ReceiptModal: Fetching store details with token:', token);
        const response = await UserService.getUserDetails(token);
        console.log('ReceiptModal: Store details response:', response);

        setStoreInfo({
          storeName: response.store_name || response.name || 'POS Store',
          phoneNumber: response.phone_number || null,
          address: response.address || null,
          store_logo: response.store_logo || response.logoUrl,
        });
      } catch (err) {
        console.error('ReceiptModal: Fetch store data error:', err);
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: user?.phone_number || null,
          address: user?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
      } finally {
        setIsLoadingStore(false);
      }
    };

    fetchStoreData();
  }, [token, user]);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const getTableNumber = () => {
    if (!order.table_id || !selectedTable) return '';
    return selectedTable.number || selectedTable.table_number || '';
  };

  const getWaiterName = () => {
    if (!order.waiter_id || !selectedWaiter) return '';
    return selectedWaiter.name || '';
  };

  const formatDateTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Karachi',
    });
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const currentDateTime = formatDateTime();
    const storeName = storeInfo.storeName;
    const storePhone = storeInfo.phoneNumber;
    const storeAddress = storeInfo.address;
    const tableNumber = getTableNumber();
    const waiterName = getWaiterName();
    const storeLogo = storeInfo.store_logo || storeInfo.logoUrl;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
<html>
<head>
<title>Receipt - Order #${order.order_number}</title>
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
    border-top: 1px solidify var(--border-color);
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
    ORDER #${order.order_number}
  </div>

  <div class="order-details">
    <div class="detail-row">
      <span>Date:</span>
      <span>${currentDateTime}</span>
    </div>
    <div class="detail-row">
      <span>Customer:</span>
      <span>${order.customer_name}</span>
    </div>
    <div class="detail-row">
      <span>Type:</span>
      <span>${order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
    </div>
    ${order.service_type === 'dine_in' && order.table_id && tableNumber ? `
    <div class="detail-row">
      <span>Table:</span>
      <span>${tableNumber}</span>
    </div>` : ''}
    ${order.service_type === 'dine_in' && order.waiter_id && waiterName ? `
    <div class="detail-row">
      <span>Waiter:</span>
      <span>${waiterName}</span>
    </div>` : ''}
    ${shouldShowPaymentMethod ? `
    <div class="detail-row">
      <span>Payment:</span>
      <span>${paymentMethod.toUpperCase()}</span>
    </div>` : ''}
  </div>

  ${order.estimated_completion ? `
  <div class="completion-time">
    ESTIMATED COMPLETION: ${order.estimated_completion}
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
        ${order.items.map(item => `
          <tr>
            <td class="item-name">${item.product?.name || 'Unknown Item'}</td>
            <td class="item-center">${item.quantity}</td>
            <td class="item-right">$${(item.product?.price || 0).toFixed(2)}</td>
            <td class="item-right">$${(item.sub_total || 0).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-row grand-total">
      <span>TOTAL</span>
      <span>$${(order.total_amount || 0).toFixed(2)}</span>
    </div>
    ${changeAmount > 0 && isPaymentProcessed ? `
    <div class="total-row">
      <span>Change Given:</span>
      <span>$${changeAmount.toFixed(2)}</span>
    </div>` : ''}
  </div>

  ${isPaymentProcessed ? `
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
    onPrint();
  };

  if (isLoadingStore) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="rounded-lg p-6 max-w-sm w-full mx-4" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--text-color)] mx-auto mb-3"></div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading store information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="rounded-lg shadow-xl max-w-[85mm] w-full max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div className="p-2 text-center relative" style={{ backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={onClose}
            className="absolute top-1 right-1 p-1 rounded-full hover:bg-[var(--background-secondary)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>{title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Order #{order.order_number}</p>
        </div>

        {/* Receipt Content */}
        <div ref={printRef} className="p-3" style={{ backgroundColor: 'var(--background-color)' }}>
          {/* Store Header */}
          <div className="flex items-center justify-center gap-2 border-b pb-2 mb-3" style={{ borderColor: 'var(--border-color)' }}>
            {storeInfo.store_logo || storeInfo.logoUrl ? (
              <img
                src={storeInfo.store_logo || storeInfo.logoUrl}
                alt="Store Logo"
                className="w-[30px] h-[30px] object-contain flex-shrink-0"
              />
            ) : null}
            <div className="text-base font-bold uppercase tracking-wide text-center" style={{ color: 'var(--text-color)' }}>
              {storeInfo.storeName}
            </div>
          </div>

          {/* Order Header */}
          <div className="text-center font-bold text-xs border-b pb-1 mb-2" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}>
            ORDER #{order.order_number}
          </div>

          {/* Order Details - Compact */}
          <div className="text-xs space-y-0.5 mb-2" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span className="font-semibold">Date:</span>
              <span className="text-right">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Customer:</span>
              <span className="text-right truncate ml-2">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Type:</span>
              <span>{order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
            </div>
            {order.service_type === 'dine_in' && order.table_id && getTableNumber() && (
              <div className="flex justify-between">
                <span className="font-semibold">Table:</span>
                <span>{getTableNumber()}</span>
              </div>
            )}
            {order.service_type === 'dine_in' && order.waiter_id && getWaiterName() && (
              <div className="flex justify-between">
                <span className="font-semibold">Waiter:</span>
                <span className="truncate ml-2">{getWaiterName()}</span>
              </div>
            )}
            {shouldShowPaymentMethod && (
              <div className="flex justify-between">
                <span className="font-semibold">Payment:</span>
                <span>{paymentMethod.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Estimated Completion - More compact */}
          {order.estimated_completion && (
            <div className="border p-1.5 text-center mb-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--background-secondary)' }}>
              <div className="font-bold text-xs" style={{ color: 'var(--text-color)' }}>EST. COMPLETION: {order.estimated_completion}</div>
            </div>
          )}

          {/* Divider */}
          <div className="text-center font-bold mb-2 text-xs" style={{ color: 'var(--text-color)' }}>----------</div>

          {/* Items Table - More compact */}
          <div className="mb-2">
            <table className="w-full text-xs">
              <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                <th className="text-left py-1 font-bold" style={{ color: 'var(--text-color)' }}>Item</th>
                <th className="text-center py-1 font-bold w-8" style={{ color: 'var(--text-color)' }}>Qty</th>
                <th className="text-right py-1 font-bold w-12" style={{ color: 'var(--text-color)' }}>Price</th>
                <th className="text-right py-1 font-bold w-12" style={{ color: 'var(--text-color)' }}>Total</th>
              </tr>
              </thead>
              <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-0.5 break-words max-w-[80px] leading-tight" style={{ color: 'var(--text-secondary)' }}>{item.product?.name || 'Unknown Item'}</td>
                  <td className="py-0.5 text-center" style={{ color: 'var(--text-secondary)' }}>{item.quantity}</td>
                  <td className="py-0.5 text-right" style={{ color: 'var(--text-secondary)' }}>${(item.product?.price || 0).toFixed(2)}</td>
                  <td className="py-0.5 text-right font-semibold" style={{ color: 'var(--text-color)' }}>${(item.sub_total || 0).toFixed(2)}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="border-t pt-1 mb-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-center font-bold text-sm" style={{ color: 'var(--text-color)' }}>
              <span>TOTAL</span>
              <span>${(order.total_amount || 0).toFixed(2)}</span>
            </div>
            {changeAmount > 0 && isPaymentProcessed && (
              <div className="flex justify-between items-center text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold">Change Given:</span>
                <span>${changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Payment Status */}
          {isPaymentProcessed && (
            <div className="text-center font-bold text-xs mb-2 border py-1" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--background-secondary)', color: 'var(--text-color)' }}>
              PAYMENT CONFIRMED ✓
            </div>
          )}

          {/* Thank You Message */}
          <div className="text-center font-bold text-sm mb-2 uppercase" style={{ color: 'var(--text-color)' }}>
            THANK YOU!
          </div>

          {/* Footer - More compact */}
          <div className="text-center text-xs border-t pt-1" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            <div className="font-semibold">{new Date().toLocaleDateString()} | {storeInfo.storeName}</div>
            {(storeInfo.address || storeInfo.phoneNumber) && (
              <div className="mt-1 leading-tight">
                {storeInfo.address && <div>{storeInfo.address}</div>}
                {storeInfo.phoneNumber && <div>Tel: {storeInfo.phoneNumber}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showButtons && (
          <div className="p-2 border-t flex gap-2" style={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={handlePrint}
              className="flex-1 px-3 py-1.5 rounded font-semibold flex items-center justify-center gap-2 text-xs"
              style={{ backgroundColor: 'var(--primary-color)', color: 'var(--text-on-primary)', '--tw-ring-color': 'var(--focus-ring)' }}
            >
              <PrinterIcon className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-3 py-1.5 rounded font-semibold text-xs border"
              style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)', '--tw-ring-color': 'var(--focus-ring)' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
