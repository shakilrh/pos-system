import React from 'react';
import { updateOrder, processPayment } from '../../services/orderService';
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
  const handleUpdateOrder = async (updates: { customer_name?: string; service_type?: string }) => {
    if (!token) {
      setMessage('Please log in to update order');
      return;
    }
    try {
      const updatedOrder = await updateOrder(token, logout, order._id, updates);
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`Order #${order.order_number} updated`);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
      setMessage(errorMessage);
      console.error('Failed to update order', error);
    }
  };

  const handleProcessPayment = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!token) {
      setMessage('Please log in to process payment');
      return;
    }
    const method = e.target.value;
    if (!method) return;

    try {
      const updatedOrder = await processPayment(
        token,
        logout,
        order._id,
        order.total_amount || 0,
        method
      );
      setOrders(orders.map(o => o._id === order._id ? updatedOrder : o));
      setMessage(`Payment processed for Order #${order.order_number}`);
      e.target.value = ''; // Reset the select
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment';
      setMessage(errorMessage);
      console.error('Failed to process payment', error);
    }
  };

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 ease-in-out">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Order #{order.order_number} Details</h2>
      <p><strong>Customer:</strong> {order.customer_name}</p>
      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Amount:</strong> ${order.total_amount?.toFixed(2) || 'N/A'}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Payment Status:</strong> {order.payment_status}</p>
      <p><strong>Service Type:</strong> {order.service_type}</p>

      <p className="mt-4"><strong>Items:</strong></p>
      <ul className="list-disc pl-5 space-y-2">
        {order.items?.map((item, index) => (
          <li key={index} className="flex items-center space-x-4">
            <img
              src={item.product?.pictureUrl || 'https://via.placeholder.com/50'}
              alt={item.product?.name || 'Product'}
              className="w-12 h-12 object-cover rounded"
            />
            <span>
              {item.product?.name || 'Unknown Product'}
              (x{item.quantity}) - ${item.sub_total?.toFixed(2) || '0.00'}
            </span>
          </li>
        ))}
      </ul>

      {order.payment_status === 'not_paid' && (
        <div className="mt-4">
          <label htmlFor="payment-method" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Process Payment
          </label>
          <select
            id="payment-method"
            onChange={handleProcessPayment}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          >
            <option value="">Select payment method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="customer-name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Customer Name
          </label>
          <input
            id="customer-name"
            type="text"
            placeholder="Update Customer Name"
            defaultValue={order.customer_name}
            onBlur={(e) => handleUpdateOrder({ customer_name: e.target.value || order.customer_name })}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white w-full"
          />
        </div>

        <div>
          <label htmlFor="service-type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Service Type
          </label>
          <select
            id="service-type"
            defaultValue={order.service_type}
            onChange={(e) => handleUpdateOrder({ service_type: e.target.value as 'dine_in' | 'take_away' })}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white w-full"
          >
            <option value="dine_in">Dine-In</option>
            <option value="take_away">Takeaway</option>
          </select>
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 w-full"
      >
        Close Details
      </button>
    </div>
  );
}
