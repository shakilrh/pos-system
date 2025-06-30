import React, { useState } from 'react';
import { Order } from './orderTypes';
import { processPayment, markOrderAsPicked } from '../../services/orderService';
import ReceiptTemplate from './receiptTemplate';

interface OrderSearchProps {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter?: string;
}

const OrderSearch: React.FC<OrderSearchProps> = ({ orders, onOrderSelect, searchTerm, setSearchTerm, statusFilter = 'ready' }) => {
  const [showResults, setShowResults] = useState(false);

  const filteredOrders = orders.filter(order =>
      order.status.toLowerCase() === statusFilter && (
        order.order_number.toString().includes(searchTerm) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleOrderSelect = (order: Order) => {
    onOrderSelect(order);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="relative mb-3">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Search ${statusFilter} orders...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => setShowResults(searchTerm.length > 0)}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">🔍</div>
        </div>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setShowResults(false);
            }}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
          >
            Clear
          </button>
        )}
      </div>
      {showResults && filteredOrders.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10 mt-2 max-h-48 overflow-y-auto">
          {filteredOrders.map((order) => (
            <button
              key={order._id}
              onClick={() => handleOrderSelect(order)}
              className="w-full p-2 text-left hover:bg-gray-50 border-b border-gray-100 text-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">#{order.order_number}</div>
                  <div className="text-sm text-gray-600">👤 {order.customer_name || 'Guest'}</div>
                </div>
                <div className="text-blue-500">→</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {showResults && searchTerm && filteredOrders.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10 mt-2 p-2 text-center text-gray-500 text-sm">
          No {statusFilter} orders found
        </div>
      )}
    </div>
  );
};

interface PaymentModalProps {
  order: Order;
  token: string | null;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orders: Order[];
  setMessage: (message: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, token, logout, onClose, setOrders, orders, setMessage }) => {
  const [receivedAmount, setReceivedAmount] = useState<string>(order.total_amount?.toString() || '0');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'payment' | 'confirm'>('payment');

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
    if (amount < order.total_amount) {
      setMessage('Payment amount too low.');
      return;
    }
    setIsProcessing(true);
    try {
      const updatedOrder = await processPayment(token, logout, order._id, amount, paymentMethod);
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === updatedOrder._id ? { ...updatedOrder, items: o.items } : o))
      );
      setCurrentStep('confirm');
      setMessage(`Payment processed for #${order.order_number}`);
      printReceipt();
    } catch (error) {
      setMessage(`Failed to process payment`);
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
        prevOrders.map((o) => (o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o))
      );
      setMessage(`Order #${order.order_number} picked up!`);
      onClose();
    } catch (error) {
      setMessage(`Failed to mark as picked`);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateChange = () => {
    const amount = parseFloat(receivedAmount);
    return isNaN(amount) ? 0 : Math.max(0, amount - order.total_amount);
  };

  const printReceipt = () => {
    const receiptItems = order.items?.map(item => ({
      name: item.product?.name || 'Unknown',
      quantity: item.quantity,
      price: item.product?.price || 0
    })) || [];
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; max-width: 300px; margin: 0 auto; padding: 10px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { padding: 4px 2px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
              .header { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #f59e0b; }
              .subheader { font-size: 18px; font-weight: bold; margin: 10px 0; color: #d97706; }
              .total-row { font-weight: bold; border-top: 2px solid #000; background-color: #fefcbf; }
              .completion-time { background-color: #fefcbf; padding: 5px; margin: 10px 0; border: 2px solid #d97706; border-radius: 5px; }
              hr { border: none; border-top: 2px solid #d97706; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">Rasnat Restaurant</div>
            <p>123 Main Street, City<br/>Phone: (123) 456-7890</p>
            <hr />
            <p class="subheader">Order #: ${order.order_number}</p>
            <p>Date: ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Karachi' })}</p>
            <p>Customer: ${order.customer_name || 'Guest'}</p>
            <p>Type: ${order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
            <p>Payment: Paid</p>
            <hr />
            <table>
              <thead>
                <tr>
                  <th style="color: #d97706;">Item</th>
                  <th style="color: #d97706;">Qty</th>
                  <th style="color: #d97706;">Price</th>
                  <th style="color: #d97706;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${receiptItems.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>$${item.price * item.quantity}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3"><strong>Total</strong></td>
                  <td><strong>$${order.total_amount.toFixed(2)}</strong></td>
                </tr>
                ${calculateChange() > 0 ? `<tr><td colspan="3">Change</td><td>$${calculateChange().toFixed(2)}</td></tr>` : ''}
              </tbody>
            </table>
            <hr />
            <p><strong>Thank you for dining with us!</strong></p>
            <p>Please visit again</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-xs">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold">#{order.order_number}</h2>
            <p className="text-sm text-gray-600">👤 {order.customer_name || 'Guest'}</p>
            <p className="text-sm text-gray-600">
              {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{item.product?.name || 'Unknown'}</span>
                <span className="text-sm">x{item.quantity}</span>
              </div>
            )) || <div className="text-sm text-gray-500">No items</div>}
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between text-base font-bold">
              <span>Total:</span>
              <span>${order.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          {currentStep === 'payment' && (
            <div className="space-y-3 border-t pt-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Amount"
              />
              {paymentMethod === 'cash' && parseFloat(receivedAmount) > order.total_amount && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  Change: ${calculateChange().toFixed(2)}
                </div>
              )}
              <button
                onClick={handlePaymentProcess}
                disabled={isProcessing || !receivedAmount || parseFloat(receivedAmount) < order.total_amount}
                className="w-full py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Process Payment'}
              </button>
            </div>
          )}
          {currentStep === 'confirm' && (
            <div className="space-y-3 border-t pt-2">
              <div className="text-center p-2 bg-green-50 rounded">
                <h3 className="text-base font-semibold text-green-800">Payment Processed!</h3>
                {paymentMethod === 'cash' && calculateChange() > 0 && (
                  <p className="text-sm text-green-700">Change: ${calculateChange().toFixed(2)}</p>
                )}
              </div>
              <button
                onClick={handleMarkAsPicked}
                disabled={isProcessing}
                className="w-full py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Mark as Picked'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
export { OrderSearch };
