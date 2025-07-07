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
              margin: 20px;
              background: white;
            }
            .receipt-container {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border: 2px solid #f59e0b;
              border-radius: 8px;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 20px;
              color: #d97706;
              font-size: 24px;
              font-weight: bold;
            }
            .receipt-details {
              border-bottom: 2px solid #f59e0b;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .receipt-details p {
              margin: 5px 0;
              font-size: 16px;
            }
            .items-title {
              font-size: 18px;
              font-weight: bold;
              color: #b45309;
              margin-bottom: 10px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .items-table th {
              background-color: #fef3c7;
              padding: 8px;
              text-align: left;
              border-bottom: 2px solid #f59e0b;
              color: #92400e;
            }
            .items-table td {
              padding: 8px;
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
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #f59e0b;
            }
            .total-amount {
              font-size: 20px;
              font-weight: bold;
              text-align: right;
              color: #b45309;
            }
            .change-amount {
              font-size: 18px;
              font-weight: bold;
              text-align: right;
              color: #059669;
              margin-top: 5px;
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
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto border-4 border-yellow-400">
        <div ref={printRef}>
          <h2 className="text-2xl font-bold mb-4 text-center text-yellow-600">{title}</h2>

          <div className="border-b-2 border-yellow-400 pb-4 mb-4">
            <p className="text-lg"><strong>Order #:</strong> {order.order_number}</p>
            <p className="text-lg"><strong>Customer:</strong> {order.customer_name}</p>
            <p className="text-lg"><strong>Type:</strong> {order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
            <p className="text-lg"><strong>Payment:</strong> {order.payment_status}</p>
            {shouldShowPaymentMethod && (
              <p className="text-lg"><strong>Method:</strong> {paymentMethod.toUpperCase()}</p>
            )}
            {order.estimated_completion && (
              <p className="text-lg"><strong>Est. Completion:</strong> {order.estimated_completion}</p>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2 text-yellow-700">Items:</h3>
            <table className="w-full text-sm">
              <thead>
              <tr className="bg-yellow-100 border-b-2 border-yellow-400">
                <th className="text-left py-2 text-yellow-800">Item</th>
                <th className="text-center py-2 text-yellow-800">Qty</th>
                <th className="text-right py-2 text-yellow-800">Price</th>
                <th className="text-right py-2 text-yellow-800">Total</th>
              </tr>
              </thead>
              <tbody>
              {order.items.map((item) => (
                <tr key={item.product_id} className="border-b border-yellow-200 hover:bg-yellow-50">
                  <td className="py-2 text-gray-800">{item.product?.name || 'Unknown Item'}</td>
                  <td className="text-center py-2 text-gray-800">{item.quantity}</td>
                  <td className="text-right py-2 text-gray-800">${(item.product?.price || 0).toFixed(2)}</td>
                  <td className="text-right py-2 text-gray-800">${(item.sub_total || 0).toFixed(2)}</td>
                </tr>
              ))}
              </tbody>
            </table>

            <div className="mt-2 pt-2 border-t-2 border-yellow-400">
              <p className="text-xl font-bold text-right text-yellow-700">
                Total: ${order.total_amount.toFixed(2)}
              </p>
              {changeAmount > 0 && isPaymentProcessed && (
                <p className="text-xl text-right text-green-600 font-bold">
                  Change: ${changeAmount.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {showButtons && (
          <div className="mt-4 flex justify-between gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
            >
              <PrinterIcon className="w-6 h-6 inline-block mr-2" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-blue-300 transition-colors text-lg font-semibold"
            >
              Close
            </button>
          </div>
        )}

        {autoClose && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              This dialog will close automatically in {autoCloseDelay / 1000} seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptModal;
