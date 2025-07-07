import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import { processPayment, markOrderAsPicked } from '../../services/orderService';
import ReceiptModal from './ReceiptModal';

interface PaymentModalProps {
  order: Order;
  token: string | null;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orders: Order[];
  setMessage: (message: string) => void;
}

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
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Search Orders
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order number, customer name, or ID..."
          className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {searchTerm && (
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <button
                key={order._id}
                onClick={() => onOrderSelect(order)}
                className="w-full p-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">#{order.order_number}</div>
                    <div className="text-xs text-gray-600">
                      👤 {order.customer_name || 'Guest'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${order.total_amount?.toFixed(2) || '0.00'}</div>
                    <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 text-sm">
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Update currentOrder when order prop changes
  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  const calculateChange = () => {
    const amount = parseFloat(receivedAmount);
    return isNaN(amount) ? 0 : Math.max(0, amount - (currentOrder.total_amount || 0));
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

    if (amount < (currentOrder.total_amount || 0)) {
      setMessage(`Payment amount too low. Required: $${(currentOrder.total_amount || 0).toFixed(2)}`);
      return;
    }

    setIsProcessing(true);

    try {
      const updatedOrder = await processPayment(token, logout, currentOrder._id, amount, paymentMethod);

      // Update the current order state
      const newOrder = { ...updatedOrder, items: currentOrder.items, payment_status: 'paid' };
      setCurrentOrder(newOrder);

      // Calculate and store change amount
      const change = calculateChange();
      setChangeAmount(change);

      // Update orders list
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o._id === updatedOrder._id ? newOrder : o
        )
      );

      setMessage(`Payment processed successfully for Order #${currentOrder.order_number}`);
      setShowReceiptModal(true);

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
      const updatedOrder = await markOrderAsPicked(token, logout, currentOrder.order_number);

      // Update the current order state
      const newOrder = { ...updatedOrder, items: currentOrder.items };
      setCurrentOrder(newOrder);

      // Update orders list
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_number === updatedOrder.order_number ? newOrder : o
        )
      );

      setMessage(`Order #${currentOrder.order_number} marked as picked up!`);
      onClose();

    } catch (error) {
      console.error('Mark as picked error:', error);
      setMessage(`Failed to mark as picked: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReceiptClose = () => {
    setShowReceiptModal(false);
    // Force a re-render to show the updated payment status
    setCurrentOrder(prev => ({ ...prev }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg w-full max-w-xs">
          {/* Header - Optimized */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <div>
              <h2 className="text-base font-bold text-gray-800">#{currentOrder.order_number}</h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>👤 {currentOrder.customer_name || 'Guest'}</p>
                <p>{currentOrder.service_type === 'dine_in' ? '🍽️' : '🥡'} {currentOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
                <p className="text-gray-500 capitalize">{currentOrder.payment_status.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Optimized */}
          <div className="p-3 space-y-3">
            {/* Order Items - Better sized */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">Items:</h3>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {currentOrder.items && currentOrder.items.length > 0 ? (
                  currentOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{item.product?.name || 'Unknown'}</span>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-medium">x{item.quantity || 0}</div>
                        <div className="text-gray-600 text-xs">
                          ${((item.product?.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">No items</div>
                )}
              </div>
            </div>

            {/* Total - Prominent */}
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold text-gray-800">
                <span>Total:</span>
                <span>${currentOrder.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {/* Payment Section - Eye-catching */}
            {currentOrder.payment_status === 'not_paid' ? (
              <div className="space-y-3 border-t pt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method:</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="mr-2 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      💵 Cash
                    </label>
                    <label className="flex items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      💳 Card
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount received"
                  />
                </div>

                {paymentMethod === 'cash' && parseFloat(receivedAmount) > (currentOrder.total_amount || 0) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm font-medium text-green-800">
                      💰 Change: ${calculateChange().toFixed(2)}
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePaymentProcess}
                  disabled={isProcessing || !receivedAmount || parseFloat(receivedAmount) < (currentOrder.total_amount || 0)}
                  className="w-full py-3 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {isProcessing ? '⏳ Processing...' : ' Process Payment'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 border-t pt-3">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800">✅ Payment Processed!</h3>
                  <p className="text-sm text-green-700">Ready for pickup</p>
                </div>
                <button
                  onClick={handleMarkAsPicked}
                  disabled={isProcessing}
                  className="w-full py-3 bg-purple-500 text-white rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors shadow-md"
                >
                  {isProcessing ? '⏳ Processing...' : '✅ Mark as Picked'}
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
        />
      )}
    </>
  );
};

export default PaymentModal;
export { OrderSearch };
