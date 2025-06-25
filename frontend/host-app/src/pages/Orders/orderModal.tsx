import React, { useState } from 'react';
import { confirmOrder } from '../../services/orderService';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 max-h-[70vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⏳</span>
              <h1 className="text-lg font-bold">Order #{order.order_number}</h1>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-full">
              <span className="text-lg">✕</span>
            </button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
            <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center">
              <span className="mr-1">🕒</span> Timeline
            </h3>
            <p className="text-xs text-indigo-600">Created: {new Date(order.created_at || order.createdAt).toLocaleString()}</p>

          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
              <span className="mr-1">🛒</span> Order Items
            </h3>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <img src={item.product?.pictureUrl || 'https://via.placeholder.com/30'} alt={item.product?.name || 'Product'} className="w-6 h-6 object-cover rounded" />
                  <span className="text-purple-800">{item.product?.name || 'Unknown'} x{item.quantity}</span>
                  <span className="ml-auto text-purple-800">${item.sub_total?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-purple-300 flex justify-between text-xs">
              <span className="font-semibold text-purple-800">Total:</span>
              <span className="font-bold text-purple-800">${order.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <span className="mr-1">⏰</span> Preparation Time
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={preparationTime}
                onChange={(e) => setPreparationTime(Number(e.target.value))}
                min="5"
                max="120"
                className="w-20 p-1 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <span className="text-gray-600">minutes</span>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleAcceptOrder}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center space-x-1"
            >
              <span>✅</span>
              <span>Accept Order</span>
            </button>
          </div>
          {isLoading && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="ml-1 text-xs text-blue-600">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
