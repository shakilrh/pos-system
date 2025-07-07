import React from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';

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
                                                     paymentMethod
                                                   }) => {
  const printRef = React.useRef<HTMLDivElement>(null);

  // Check if payment has been processed
  const isPaymentProcessed = order.payment_status === 'paid';
  const shouldShowPaymentMethod = paymentMethod && isPaymentProcessed;

  // Auto-close functionality
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order #${order.order_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 15px;
              background: white;
              font-size: 14px;
            }
            .receipt-container {
              max-width: 320px;
              margin: 0 auto;
              background: white;
              padding: 15px;
              border: 2px solid #f59e0b;
              border-radius: 8px;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 15px;
              color: #d97706;
              font-size: 20px;
              font-weight: bold;
            }
            .receipt-details {
              border-bottom: 2px solid #f59e0b;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .receipt-details p {
              margin: 3px 0;
              font-size: 14px;
            }
            .items-title {
              font-size: 16px;
              font-weight: bold;
              color: #b45309;
              margin-bottom: 8px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              font-size: 13px;
            }
            .items-table th {
              background-color: #fef3c7;
              padding: 5px;
              text-align: left;
              border-bottom: 2px solid #f59e0b;
              color: #92400e;
            }
            .items-table td {
              padding: 5px;
              border-bottom: 1px solid #fde68a;
            }
            .items-table th:nth-child(2), .items-table td:nth-child(2) {
              text-align: center;
            }
            .items-table th:nth-child(3), .items-table td:nth-child(3),
            .items-table th:nth-child(4), .items-table td:nth-child(4) {
              text-align: right;
            }
            .receipt-total {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #f59e0b;
            }
            .total-amount {
              font-size: 18px;
              font-weight: bold;
              text-align: right;
              color: #b45309;
            }
            .change-amount {
              font-size: 16px;
              font-weight: bold;
              text-align: right;
              color: #059669;
              margin-top: 3px;
            }
            @media print {
              body { margin: 0; }
              .receipt-container {
                border: none;
                box-shadow: none;
                max-width: none;
                margin: 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">${title}</div>

            <div class="receipt-details">
              <p><strong>Order #:</strong> ${order.order_number}</p>
              <p><strong>Customer:</strong> ${order.customer_name}</p>
              <p><strong>Type:</strong> ${order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
              <p><strong>Payment:</strong> ${order.payment_status}</p>
              ${shouldShowPaymentMethod ? `<p><strong>Method:</strong> ${paymentMethod.toUpperCase()}</p>` : ''}
              ${order.estimated_completion ? `<p><strong>Est. Completion:</strong> ${order.estimated_completion}</p>` : ''}
            </div>

            <div class="items-title">Items:</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.product?.name || 'Unknown Item'}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.product?.price || 0).toFixed(2)}</td>
                    <td>$${(item.sub_total || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="receipt-total">
              <div class="total-amount">Total: $${order.total_amount.toFixed(2)}</div>
              ${changeAmount > 0 && isPaymentProcessed ? `<div class="change-amount">Change: $${changeAmount.toFixed(2)}</div>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();

    // Call the original onPrint callback
    onPrint();
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg shadow-2xl w-80 max-h-[90vh] overflow-y-auto border-2 border-amber-400 transform transition-all duration-300 scale-105">
          <div ref={printRef}>
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white p-3 rounded-t-lg">
              <h2 className="text-lg font-bold text-center">{title}</h2>
            </div>

            {/* Order details section */}
            <div className="p-4 space-y-1 bg-amber-50 border-b border-amber-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Order #:</span>
                <span className="text-sm font-bold text-amber-700">{order.order_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Customer:</span>
                <span className="text-sm text-gray-800">{order.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <span className="text-sm text-gray-800">{order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Payment:</span>
                <span className="text-sm capitalize text-green-600 font-semibold">{order.payment_status}</span>
              </div>
              {shouldShowPaymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Method:</span>
                    <span className="text-sm text-gray-800 uppercase">{paymentMethod}</span>
                  </div>
              )}
              {order.estimated_completion && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Est. Completion:</span>
                    <span className="text-sm text-gray-800">{order.estimated_completion}</span>
                  </div>
              )}
            </div>

            {/* Items section */}
            <div className="p-4">
              <h3 className="text-sm font-bold mb-2 text-amber-700 border-b border-amber-200 pb-1">Items Ordered</h3>
              <div className="space-y-2">
                {order.items.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">{item.product?.name || 'Unknown Item'}</span>
                        <span className="text-xs text-gray-500 ml-2">x{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-800">${(item.sub_total || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">${(item.product?.price || 0).toFixed(2)} each</div>
                      </div>
                    </div>
                ))}
              </div>

              {/* Total section */}
              <div className="mt-3 pt-3 border-t-2 border-amber-400 bg-amber-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-amber-800">Total:</span>
                  <span className="text-lg font-bold text-amber-800">${order.total_amount.toFixed(2)}</span>
                </div>
                {changeAmount > 0 && isPaymentProcessed && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-semibold text-green-600">Change:</span>
                      <span className="text-sm font-semibold text-green-600">${changeAmount.toFixed(2)}</span>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {showButtons && (
              <div className="p-4 flex gap-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
                <button
                    onClick={handlePrint}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Print
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
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
