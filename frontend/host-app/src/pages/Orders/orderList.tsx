import React from 'react';
import { confirmOrder, cancelOrder, markOrderAsReady, markOrderAsPicked, updateOrder } from '../../services/orderService';
import { Order } from './orderTypes';

interface OrderListProps {
  orders: Order[];
  page: number;
  itemsPerPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig: (config: { key: string; direction: 'asc' | 'desc' } | null) => void;
  preparationTime: number;
  setPreparationTime: (time: number) => void;
  message: string;
  setMessage: (message: string) => void;
  token: string | null;
  logout: () => void;
  onViewDetails: (order: Order) => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export default function OrderList({
                                    orders,
                                    page,
                                    itemsPerPage,
                                    totalPages,
                                    setPage,
                                    setItemsPerPage,
                                    searchTerm,
                                    setSearchTerm,
                                    statusFilter,
                                    setStatusFilter,
                                    sortConfig,
                                    setSortConfig,
                                    preparationTime,
                                    setPreparationTime,
                                    message,
                                    setMessage,
                                    token,
                                    logout,
                                    onViewDetails,
                                    setOrders,
                                  }: OrderListProps) {
  const sortedOrders = React.useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (sortConfig !== null) {
      return [...orders].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, sortConfig]);

  const filteredOrders = sortedOrders.filter(order =>
    (statusFilter === 'All' || order.status === statusFilter) &&
    (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toString().includes(searchTerm.toLowerCase()))
  );

  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleUpdateOrder = async (order_id: string, updateData: { items?: OrderItem[]; customer_name?: string }) => {
    if (!token) {
      setMessage('Please log in to update order');
      return;
    }
    try {
      const updatedOrder = await updateOrder(token, logout, order_id, updateData);
      setOrders(orders.map(order => order._id === order_id ? updatedOrder : order));
      setMessage(`Order #${updatedOrder.order_number} updated`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update order';
      setMessage(errorMessage);
      console.error('Failed to update order', error);
    }
  };

  const handleAcceptOrder = async (order_id: string) => {
    if (!token) {
      setMessage('Please log in to accept order');
      return;
    }
    try {
      const updatedOrder = await confirmOrder(token, logout, order_id, preparationTime);
      setOrders(orders.map(order => order._id === order_id ? updatedOrder : order));
      setMessage(`Order #${updatedOrder.order_number} accepted`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept order';
      setMessage(errorMessage);
      console.error('Failed to accept order', error);
    }
  };

  const handleRejectOrder = async (order_id: string) => {
    if (!token) {
      setMessage('Please log in to reject order');
      return;
    }
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    try {
      const updatedOrder = await cancelOrder(token, logout, order_id);
      setOrders(orders.map(order => order._id === order_id ? updatedOrder : order));
      setMessage(`Order #${updatedOrder.order_number} rejected`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject order';
      setMessage(errorMessage);
      console.error('Failed to reject order', error);
    }
  };

  const handleMarkAsReady = async (order_number: string) => {
    if (!token) {
      setMessage('Please log in to mark order as ready');
      return;
    }
    try {
      const updatedOrder = await markOrderAsReady(token, logout, order_number);
      setOrders(orders.map(order => order.order_number === order_number ? updatedOrder : order));
      setMessage(`Order #${order_number} marked as ready`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as ready';
      setMessage(errorMessage);
      console.error('Failed to mark order as ready', error);
    }
  };

  const handleMarkAsPicked = async (order_number: string) => {
    if (!token) {
      setMessage('Please log in to mark order as picked');
      return;
    }
    try {
      const updatedOrder = await markOrderAsPicked(token, logout, order_number);
      setOrders(orders.map(order => order.order_number === order_number ? updatedOrder : order));
      setMessage(`Order #${order_number} marked as picked`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as picked';
      setMessage(errorMessage);
      console.error('Failed to mark order as picked', error);
    }
  };

  const renderActions = (order: Order) => {
    switch (order.status.toLowerCase()) {
      case 'pending':
      case 'new':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleUpdateOrder(order._id, { items: order.items })}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Update
            </button>
            <button
              onClick={() => handleAcceptOrder(order._id)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Confirm
            </button>
            <button
              onClick={() => handleRejectOrder(order._id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Cancel
            </button>
          </div>
        );
      case 'processing':
      case 'confirmed':
        return (
          <button
            onClick={() => handleMarkAsReady(order.order_number)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Mark as Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => handleMarkAsPicked(order.order_number)}
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            Mark as Picked
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <input
          type="text"
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="new">New</option>
          <option value="processing">Processing</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready</option>
          <option value="picked">Picked</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="number"
          value={preparationTime}
          onChange={(e) => setPreparationTime(Number(e.target.value))}
          placeholder="Prep Time (min)"
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full sm:w-32 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        />
      </div>

      {message && (
        <div className={`p-4 mb-4 rounded-lg ${
          message.toLowerCase().includes('failed') ||
          message.toLowerCase().includes('error') ||
          message.toLowerCase().includes('cannot') ||
          message.toLowerCase().includes('denied')
            ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200'
            : 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
          <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('order_number')}>
              Order Number {sortConfig?.key === 'order_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
              Date {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('customer_name')}>
              Customer Name {sortConfig?.key === 'customer_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('total_amount')}>
              Amount {sortConfig?.key === 'total_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('status')}>
              Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
            </th>
            <th className="py-3 px-4">Actions</th>
          </tr>
          </thead>
          <tbody>
          {paginatedOrders.map((order) => (
            <tr key={order._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4">
                <button className="text-indigo-600 hover:underline" onClick={() => onViewDetails(order)}>
                  {order.order_number}
                </button>
              </td>
              <td className="py-3 px-4">{new Date(order.createdAt).toLocaleString()}</td>
              <td className="py-3 px-4">{order.customer_name}</td>
              <td className="py-3 px-4">${order.total_amount?.toFixed(2) || 'N/A'}</td>
              <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'new' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' :
                      order.status.toLowerCase() === 'processing' || order.status.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200' :
                        order.status.toLowerCase() === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' :
                          order.status.toLowerCase() === 'picked' ? 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200' :
                            'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200'
                  }`}>
                    {order.status}
                  </span>
              </td>
              <td className="py-3 px-4">{renderActions(order)}</td>
            </tr>
          ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center p-4">
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          >
            <option value={8}>8 per page</option>
            <option value={16}>16 per page</option>
            <option value={24}>24 per page</option>
          </select>
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${page === i + 1 ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</span>
        </div>
      </div>
    </>
  );
}
