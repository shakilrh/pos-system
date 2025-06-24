import React, { useState } from 'react';
import { confirmOrder, updateOrder } from '../../services/orderService';
import { Order } from './orderTypes';

interface OrderModalProps {
  order: Order;
  token: string | null;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  orders: Order[];
  setMessage: (message: string) => void;
  preparationTime: number;
  setPreparationTime: (time: number) => void;
}

export default function OrderModal({
                                     order,
                                     token,
                                     logout,
                                     onClose,
                                     setOrders,
                                     orders,
                                     setMessage,
                                     preparationTime,
                                     setPreparationTime,
                                   }: OrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);

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
      setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to accept order'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOrder = async (updates: { customer_name?: string; service_type?: string; items?: { product_id: string; quantity: number }[] }) => {
    if (!token) {
      setMessage('Please log in to update order');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await updateOrder(token, logout, order._id, updates);
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`📝 Order #${order.order_number} updated successfully!`);
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to update order'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">⏳</span>
              <div>
                <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
                <p className="opacity-90">Status: Pending</p>
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
                  disabled={isLoading}
                />
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
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">⚡</span> Order Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAcceptOrder}
                disabled={isLoading}
                className="bg-green-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-green-600 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>✅</span>
                <span>Accept Order</span>
              </button>
            </div>
            {isLoading && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-blue-600">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
