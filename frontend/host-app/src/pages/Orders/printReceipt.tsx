import toast from 'react-hot-toast';
import { Waiter} from './orderDetails';
import { getUserDetails } from '../../services/UserService';
import { Order } from '../../services/orderService';

interface Table {
    _id: string;
    number: string;
    table_number?: string;
}

interface StoreInfo {
    storeName: string;
    phoneNumber: string | null;
    address: string | null;
    store_logo?: string;
    logoUrl?: string;
}

interface PrintReceiptProps {
    createdOrder: Order;
    storeInfo: StoreInfo;
    activeCurrency: string;
    selectedTable?: Table | null;
    selectedWaiter?: Waiter | null;
    changeAmount?: number;
    paymentMethod?: string;
    formatPrice: (price: number, currency: string) => string;
}

export const printReceipt = ({
                                 createdOrder,
                                 storeInfo,
                                 activeCurrency,
                                 selectedTable,
                                 selectedWaiter,
                                 changeAmount = 0,
                                 paymentMethod,
                                 formatPrice,
                             }: PrintReceiptProps) => {
    const getTableNumber = () => {
        if (!createdOrder.table_id || !selectedTable) return '';
        return selectedTable.number || selectedTable.table_number || '';
    };

    const getWaiterName = () => {
        if (!createdOrder.waiter_id || !selectedWaiter) return '';
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

    const currentDateTime = formatDateTime();
    const storeName = storeInfo.storeName;
    const storePhone = storeInfo.phoneNumber;
    const storeAddress = storeInfo.address;
    const tableNumber = getTableNumber();
    const waiterName = getWaiterName();
    const storeLogo = storeInfo.store_logo || storeInfo.logoUrl;
    const isPaymentProcessed = createdOrder.payment_status === 'paid';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
<html>
<head>
<title>Receipt - Order #${createdOrder.order_number}</title>
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
    ORDER #${createdOrder.order_number}
  </div>

  <div class="order-details">
    <div class="detail-row">
      <span>Date:</span>
      <span>${currentDateTime}</span>
    </div>
    <div class="detail-row">
      <span>Customer:</span>
      <span>${createdOrder.customer_name}</span>
    </div>
    <div class="detail-row">
      <span>Type:</span>
      <span>${createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
    </div>
    ${createdOrder.service_type === 'dine_in' && createdOrder.table_id && tableNumber ? `
    <div class="detail-row">
      <span>Table:</span>
      <span>${tableNumber}</span>
    </div>` : ''}
    ${createdOrder.service_type === 'dine_in' && createdOrder.waiter_id && waiterName ? `
    <div class="detail-row">
      <span>Waiter:</span>
      <span>${waiterName}</span>
    </div>` : ''}
  </div>

  ${createdOrder.estimated_completion ? `
  <div class="completion-time">
    ESTIMATED COMPLETION: ${createdOrder.estimated_completion}
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
        ${createdOrder.items.map(item => `
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
      <span>${formatPrice(createdOrder.total_amount || 0, activeCurrency)}</span>
    </div>
    ${changeAmount > 0 && isPaymentProcessed ? `
    <div class="total-row">
      <span>Change Given:</span>
      <span>${formatPrice(changeAmount, activeCurrency)}</span>
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
    toast.success('Receipt printed successfully!');
};