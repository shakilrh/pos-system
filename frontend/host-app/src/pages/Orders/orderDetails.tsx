import React, { useState } from 'react';
import { confirmOrder, cancelOrder, markOrderAsReady, markOrderAsPicked, updateOrder, processPayment } from '../../services/orderService';
import { Order } from './orderTypes';

interface OrderDetailsProps {
  order: Order;
  token: string | null;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orders: Order[];
  setMessage: (message: string) => void;
}

export default function OrderDetails({
                                       order,
                                       token,
                                       logout,
                                       onClose,
                                       setOrders,
                                       orders,
                                       setMessage,
                                     }: OrderDetailsProps) {
  const [preparationTime, setPreparationTime] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const statusConfig = {
    pending: { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', text: 'text-white', icon: '⏳', label: 'Pending' },
    processing: { bg: 'bg-gradient-to-r from-green-500 to-green-600', text: 'text-white', icon: '👨‍🍳', label: 'Processing' },
    ready: { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', text: 'text-white', icon: '✅', label: 'Ready' },
    picked: { bg: 'bg-gradient-to-r from-purple-500 to-purple-600', text: 'text-white', icon: '🚚', label: 'Picked' },
    completed: { bg: 'bg-gradient-to-r from-orange-500 to-orange-600', text: 'text-white', icon: '🎉', label: 'Completed' },
    cancelled: { bg: 'bg-gradient-to-r from-red-500 to-red-600', text: 'text-white', icon: '❌', label: 'Cancelled' }
  };

  const currentStatus = statusConfig[order.status.toLowerCase()] || statusConfig.pending;

  const handleCancelOrder = async () => {
    if (!token) {
      setMessage('Please log in to cancel order');
      return;
    }
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setIsLoading(true);
    try {
      const updatedOrder = await cancelOrder(token, logout, order._id);
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`Order #${updatedOrder.order_number} cancelled successfully! 🚫`);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
      setMessage(`❌ ${errorMessage}`);
      console.error('Failed to cancel order', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!token) {
      setMessage('Please log in to accept order');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await confirmOrder(token, logout, order._id, preparationTime);
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`🎉 Order #${updatedOrder.order_number} accepted! Preparation time: ${preparationTime} minutes`);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept order';
      setMessage(`❌ ${errorMessage}`);
      console.error('Failed to accept order', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsReady = async () => {
    if (!token) {
      setMessage('Please log in to mark order as ready');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await markOrderAsReady(token, logout, order.order_number);
      setOrders(orders.map(o => o.order_number === order.order_number ? updatedOrder : o));
      setMessage(`✅ Order #${order.order_number} is now ready for pickup!`);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as ready';
      setMessage(`❌ ${errorMessage}`);
      console.error('Failed to mark order as ready', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPicked = async () => {
    if (!token) {
      setMessage('Please log in to mark order as picked');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await markOrderAsPicked(token, logout, order.order_number);
      setOrders(orders.map(o => o.order_number === order.order_number ? updatedOrder : o));
      setMessage(`🚚 Order #${order.order_number} has been picked up!`);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as picked';
      setMessage(`❌ ${errorMessage}`);
      console.error('Failed to mark order as picked', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrder = async (updates: { customer_name?: string; service_type?: string; items?: { product_id: string; quantity: number }[] }) => {
    if (!token) {
      setMessage('Please log in to update order');
      return;
    }
    if (order.status.toLowerCase() !== 'pending') {
      setMessage('Order can only be updated in pending status');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await updateOrder(token, logout, order._id, updates);
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`📝 Order #${order.order_number} updated successfully!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
      setMessage(`❌ ${errorMessage}`);
      console.error('Failed to update order', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayment = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!token) {
      setMessage('Please log in to process payment');
      return;
    }
    const method = e.target.value;
    if (!method) return;
    setIsLoading(true);
    try {
      const updatedOrder = await processPayment(
        token,
        logout,
        order._id,
        order.total_amount || 0,
        method
      );
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`💳 Payment processed successfully for Order #${order.order_number}!`);
      e.target.value = '';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      setMessage(`❌ ${errorMessage}`);
      console.error('Failed to process payment', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    const status = order.status.toLowerCase();
    if (status === 'pending') {
      actions.push({
        key: 'accept',
        label: 'Accept Order',
        icon: '✅',
        color: 'bg-green-500 hover:bg-green-600',
        handler: handleAcceptOrder
      });
      actions.push({
        key: 'cancel',
        label: 'Cancel Order',
        icon: '❌',
        color: 'bg-red-500 hover:bg-red-600',
        handler: handleCancelOrder
      });
    }
    if (status === 'processing') {
      actions.push({
        key: 'ready',
        label: 'Mark as Ready',
        icon: '🍽️',
        color: 'bg-blue-500 hover:bg-blue-600',
        handler: handleMarkAsReady
      });
    }
    if (status === 'ready') {
      actions.push({
        key: 'picked',
        label: 'Mark as Picked',
        icon: '🚚',
        color: 'bg-purple-500 hover:bg-purple-600',
        handler: handleMarkAsPicked
      });
    }
    return actions;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`${currentStatus.bg} ${currentStatus.text} p-6 rounded-t-2xl`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{currentStatus.icon}</span>
              <div>
                <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
                <p className="opacity-90">Status: {currentStatus.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">👤</span> Customer Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  defaultValue={order.customer_name}
                  onBlur={(e) => handleUpdateOrder({ customer_name: e.target.value || order.customer_name })}
                  className="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading || order.status.toLowerCase() !== 'pending'}
                />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
              <span className="mr-2">📋</span> Order Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Order Date</label>
                <div className="p-3 bg-green-100 border-2 border-green-300 rounded-lg text-green-800">
                  {new Date(order.createdAt || order.created_at || new Date()).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Service Type</label>
                <select
                  defaultValue={order.service_type}
                  onChange={(e) => handleUpdateOrder({ service_type: e.target.value as 'dine_in' | 'take_away' })}
                  className="w-full p-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  disabled={isLoading || order.status.toLowerCase() !== 'pending'}
                >
                  <option value="dine_in">🍽️ Dine-In</option>
                  <option value="take_away">🥡 Takeaway</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-700 mb-1">Payment Status</label>
                <div className={`p-3 rounded-lg border-2 font-medium ${
                  order.payment_status === 'paid'
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-red-100 border-red-300 text-red-800'
                }`}>
                  {order.payment_status === 'paid' ? '✅ Paid' : '❌ Not Paid'}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
              <span className="mr-2">🛍️</span> Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 bg-white p-3 rounded-lg border border-purple-200">
                  <img
                    src={item.product?.pictureUrl || 'https://via.placeholder.com/60'}
                    alt={item.product?.name || 'Product'}
                    className="w-12 h-12 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800">{item.product?.name || 'Unknown Product'}</h4>
                    <p className="text-purple-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-800 text-lg">${item.sub_total?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-300">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-purple-800">Total Amount:</span>
                <span className="text-2xl font-bold text-purple-800">${order.total_amount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          {order.payment_status === 'not_paid' && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                <span className="mr-2">💳</span> Process Payment
              </h3>
              <select
                onChange={handleProcessPayment}
                className="w-full p-3 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                disabled={isLoading}
              >
                <option value="">Select payment method</option>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
              </select>
            </div>
          )}
          {order.status.toLowerCase() === 'pending' && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                <span className="mr-2">⏰</span> Preparation Time
              </h3>
              <div className="flex items-center space-x-4">
                <label className="text-indigo-700 font-medium">Estimated time (minutes):</label>
                <input
                  type="number"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(Number(e.target.value))}
                  min="5"
                  max="120"
                  className="w-24 p-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <span className="text-indigo-600">minutes</span>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">⚡</span> Order Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              {getAvailableActions().map((action) => (
                <button
                  key={action.key}
                  onClick={action.handler}
                  disabled={isLoading}
                  className={`${action.color} text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
            {isLoading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-600">Processing...</span>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200">
            <h3 className="text-lg font-semibold text-teal-800 mb-3 flex items-center">
              <span className="mr-2">📅</span> Order Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <span className="text-teal-700">
                  Order created: {new Date(order.createdAt || order.created_at || new Date()).toLocaleString()}
                </span>
              </div>
              {order.status !== 'pending' && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-teal-700">Current status: {currentStatus.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
