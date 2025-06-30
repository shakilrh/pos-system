import React, { useState } from 'react';
import { Order } from './orderTypes';
import { processPayment, markOrderAsPicked } from '../../services/orderService';

interface PaymentModalProps {
  order: Order;
  token: string | null;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orders: Order[];
  setMessage: (message: string) => void;
}

// OrderSearch component that was missing
interface OrderSearchProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
}

const OrderSearch: React.FC<OrderSearchProps> = ({
                                                   orders,
                                                   onOrderSelect,
                                                   searchTerm,
                                                   setSearchTerm,
                                                   statusFilter
                                                 }) => {
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = !searchTerm ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toString().includes(searchTerm) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Orders
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order number, customer name, or ID..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {searchTerm && (
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <button
                key={order._id}
                onClick={() => onOrderSelect(order)}
                className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Order #{order.order_number}</div>
                    <div className="text-sm text-gray-600">
                      👤 {order.customer_name || 'Guest'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${order.total_amount?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm text-gray-500">{order.items?.length || 0} items</div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No orders found matching your search
            </div>
          )}
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
                                                     setMessage
                                                   }) => {
  const [receivedAmount, setReceivedAmount] = useState<string>(order.total_amount?.toString() || '0');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'payment' | 'confirm'>('payment');

  const calculateChange = () => {
    const amount = parseFloat(receivedAmount);
    return isNaN(amount) ? 0 : Math.max(0, amount - (order.total_amount || 0));
  };

  const printReceipt = () => {
    // Ensure we have items to print
    const receiptItems = order.items?.map(item => ({
      name: item.product?.name || 'Unknown Item',
      quantity: item.quantity || 0,
      price: item.product?.price || 0,
      subtotal: (item.product?.price || 0) * (item.quantity || 0)
    })) || [];

    // Calculate totals
    const subtotal = receiptItems.reduce((sum, item) => sum + item.subtotal, 0);
    const changeAmount = calculateChange();
    const paidAmount = parseFloat(receivedAmount);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Order #${order.order_number}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                text-align: center;
                max-width: 300px;
                margin: 0 auto;
                padding: 10px;
                font-size: 12px;
                line-height: 1.4;
              }
              .header {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #2c5282;
                text-transform: uppercase;
              }
              .subheader {
                font-size: 14px;
                font-weight: bold;
                margin: 10px 0;
                color: #2d3748;
              }
              .divider {
                border: none;
                border-top: 1px dashed #000;
                margin: 8px 0;
              }
              .thick-divider {
                border: none;
                border-top: 2px solid #000;
                margin: 10px 0;
              }
              .info-line {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                font-size: 11px;
              }
              .item-line {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
                font-size: 11px;
              }
              .item-name {
                flex: 1;
                text-align: left;
                padding-right: 5px;
              }
              .item-qty {
                width: 30px;
                text-align: center;
              }
              .item-price {
                width: 50px;
                text-align: right;
              }
              .total-section {
                margin-top: 10px;
                font-size: 12px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
              }
              .grand-total {
                font-weight: bold;
                font-size: 14px;
                background-color: #f7fafc;
                padding: 5px;
                border: 1px solid #e2e8f0;
              }
              .payment-info {
                background-color: #edf2f7;
                padding: 8px;
                margin: 10px 0;
                border-radius: 4px;
              }
              .footer {
                margin-top: 15px;
                font-size: 11px;
                color: #4a5568;
              }
              .thank-you {
                font-weight: bold;
                margin: 10px 0;
                color: #2c5282;
              }
            </style>
          </head>
          <body>
            <div class="header">Rasnat Restaurant</div>
            <div style="font-size: 10px; color: #666;">
              123 Main Street, City<br/>
              Phone: (123) 456-7890<br/>
              Email: info@rasnat.com
            </div>

            <hr class="thick-divider" />

            <div class="subheader">RECEIPT</div>

            <div class="info-line">
              <span>Order #:</span>
              <span><strong>${order.order_number}</strong></span>
            </div>

            <div class="info-line">
              <span>Date:</span>
              <span>${new Date().toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Karachi'
      })}</span>
            </div>

            <div class="info-line">
              <span>Customer:</span>
              <span>${order.customer_name || 'Guest'}</span>
            </div>

            <div class="info-line">
              <span>Service:</span>
              <span>${order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
            </div>

            <div class="info-line">
              <span>Payment:</span>
              <span>${paymentMethod.toUpperCase()}</span>
            </div>

            <hr class="divider" />

            <div style="font-weight: bold; margin: 8px 0; font-size: 12px;">ORDER ITEMS</div>

            ${receiptItems.length > 0 ? receiptItems.map(item => `
              <div class="item-line">
                <div class="item-name">${item.name}</div>
                <div class="item-qty">x${item.quantity}</div>
                <div class="item-price">$${item.subtotal.toFixed(2)}</div>
              </div>
              <div style="font-size: 10px; color: #666; text-align: left; margin-left: 5px;">
                $${item.price.toFixed(2)} each
              </div>
            `).join('') : '<div style="text-align: center; color: #666;">No items found</div>'}

            <hr class="divider" />

            <div class="total-section">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
              </div>

              <div class="total-line grand-total">
                <span><strong>TOTAL:</strong></span>
                <span><strong>$${(order.total_amount || 0).toFixed(2)}</strong></span>
              </div>
            </div>

            <div class="payment-info">
              <div class="total-line">
                <span>Amount Paid:</span>
                <span><strong>$${paidAmount.toFixed(2)}</strong></span>
              </div>

              ${changeAmount > 0 ? `
                <div class="total-line" style="color: #38a169;">
                  <span>Change Given:</span>
                  <span><strong>$${changeAmount.toFixed(2)}</strong></span>
                </div>
              ` : ''}
            </div>

            <hr class="thick-divider" />

            <div class="thank-you">Thank you for dining with us!</div>
            <div class="footer">
              Please visit us again<br/>
              Follow us on social media @rasnatrestaurant
            </div>

            <div style="font-size: 10px; color: #999; margin-top: 15px;">
              Receipt generated on ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
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

    if (amount < (order.total_amount || 0)) {
      setMessage(`Payment amount too low. Required: $${(order.total_amount || 0).toFixed(2)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const updatedOrder = await processPayment(token, logout, order._id, amount, paymentMethod);

      // Update the orders list with the processed payment
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === updatedOrder._id
            ? { ...updatedOrder, items: o.items } // Preserve existing items
            : o
        )
      );

      setCurrentStep('confirm');
      setMessage(`Payment processed successfully for Order #${order.order_number}`);

      // Print receipt after successful payment
      setTimeout(() => {
        printReceipt();
      }, 500); // Small delay to ensure state is updated

    } catch (error) {
      console.error('Payment processing error:', error);
      setMessage(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPicked = async () => {
    if (!token) {
      setMessage('Please log in.');
      return;
    }

    setIsProcessing(true);

    try {
      const updatedOrder = await markOrderAsPicked(token, logout, order.order_number);

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_number === updatedOrder.order_number
            ? { ...updatedOrder, items: o.items } // Preserve existing items
            : o
        )
      );

      setMessage(`Order #${order.order_number} marked as picked up!`);
      onClose();

    } catch (error) {
      console.error('Mark as picked error:', error);
      setMessage(`Failed to mark as picked: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold">Order #{order.order_number}</h2>
            <p className="text-sm text-gray-600">👤 {order.customer_name || 'Guest'}</p>
            <p className="text-sm text-gray-600">
              {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
            </p>
            <p className="text-xs text-gray-500">Status: {order.status}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Order Items:</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.product?.name || 'Unknown Item'}</span>
                      <div className="text-xs text-gray-500">
                        ${item.product?.price?.toFixed(2) || '0.00'} each
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">x{item.quantity || 0}</div>
                      <div className="text-xs text-gray-600">
                        ${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-2">No items available</div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="space-y-3 border-t pt-3">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="digital">Digital Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount Received:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount received"
                />
              </div>

              {paymentMethod === 'cash' && parseFloat(receivedAmount) > (order.total_amount || 0) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="text-sm font-medium text-green-800">
                    Change to return: ${calculateChange().toFixed(2)}
                  </div>
                </div>
              )}

              <button
                onClick={handlePaymentProcess}
                disabled={isProcessing || !receivedAmount || parseFloat(receivedAmount) < (order.total_amount || 0)}
                className="w-full py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing Payment...' : 'Process Payment & Print Receipt'}
              </button>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirm' && (
            <div className="space-y-3 border-t pt-3">
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded">
                <h3 className="text-lg font-semibold text-green-800">✅ Payment Processed!</h3>
                <p className="text-sm text-green-700">Receipt has been printed</p>
                {paymentMethod === 'cash' && calculateChange() > 0 && (
                  <p className="text-sm text-green-700 font-medium">
                    Change: ${calculateChange().toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={printReceipt}
                  className="flex-1 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors"
                >
                  🖨️ Print Receipt Again
                </button>

                <button
                  onClick={handleMarkAsPicked}
                  disabled={isProcessing}
                  className="flex-1 py-2 bg-purple-500 text-white rounded font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
                >
                  {isProcessing ? 'Processing...' : '✅ Mark as Picked'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
export { OrderSearch };
