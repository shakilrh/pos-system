import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

export default function Orders() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const dummyOrders = [
          { id: '5552311', date: '2025-05-20T09:31:00Z', customerName: 'Olivia Shine', location: '35 Station Road London', amount: '$82.46', status: 'on_delivery', items: [{ name: 'Pizza', quantity: 2 }, { name: 'Biryani', quantity: 1 }] },
          { id: '5552322', date: '2025-05-20T09:32:00Z', customerName: 'Samantha Bake', location: '79 The Drive London', amount: '$22.18', status: 'new', items: [{ name: 'Burger', quantity: 1 }, { name: 'Biryani', quantity: 1 }] },
          { id: '5552349', date: '2025-05-20T09:33:00Z', customerName: 'Roberto Carlo', location: '544 Manor Road London', amount: '$34.41', status: 'delivered', items: [{ name: 'Pasta', quantity: 1 }, { name: 'Biryani', quantity: 2 }] },
          { id: '5552350', date: '2025-05-20T09:34:00Z', customerName: 'Emma Stone', location: '12 Park Lane London', amount: '$50.00', status: 'new', items: [{ name: 'Salad', quantity: 1 }, { name: 'Biryani', quantity: 1 }] },
          { id: '5552360', date: '2025-05-20T09:35:00Z', customerName: 'Liam Smith', location: '88 High Street London', amount: '$15.99', status: 'preparing', items: [{ name: 'Sandwich', quantity: 2 }] },
          { id: '5552370', date: '2025-05-20T09:36:00Z', customerName: 'Sophie Turner', location: '23 Oak Road London', amount: '$67.89', status: 'on_delivery', items: [{ name: 'Pizza', quantity: 1 }, { name: 'Biryani', quantity: 1 }] },
          { id: '5552380', date: '2025-05-20T09:37:00Z', customerName: 'Noah James', location: '45 Elm Street London', amount: '$29.50', status: 'delivered', items: [{ name: 'Burger', quantity: 1 }] },
          { id: '5552390', date: '2025-05-20T09:38:00Z', customerName: 'Ava Wilson', location: '67 Pine Road London', amount: '$44.75', status: 'new', items: [{ name: 'Pasta', quantity: 1 }, { name: 'Biryani', quantity: 1 }] },
          { id: '5552400', date: '2025-05-20T16:11:00Z', customerName: 'John Doe', location: '99 Maple Lane London', amount: '$60.00', status: 'new', items: [{ name: 'Pizza', quantity: 2 }] },
        ];
        setOrders(dummyOrders);
        setTotalPages(Math.ceil(dummyOrders.length / itemsPerPage));
      } catch (error) {
        setMessage('Failed to fetch orders');
        console.error('Failed to fetch orders', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [searchTerm, statusFilter, page, itemsPerPage]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleAcceptOrder = async (id: string) => {
    try {
      setOrders(orders.map(order =>
        order.id === id ? { ...order, status: 'preparing' } : order
      ));
      setMessage(`Order #${id} accepted`);
    } catch (error) {
      setMessage('Failed to accept order');
      console.error('Failed to accept order', error);
    }
  };

  const handleRejectOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    try {
      setOrders(orders.map(order =>
        order.id === id ? { ...order, status: 'rejected' } : order
      ));
      setMessage(`Order #${id} rejected`);
    } catch (error) {
      setMessage('Failed to reject order');
      console.error('Failed to reject order', error);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setOrders(orders.map(order =>
        order.id === id ? { ...order, status: newStatus } : order
      ));
      setMessage(`Order #${id} status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      setMessage('Failed to update status');
      console.error('Failed to update status', error);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const order = orders.find(o => o.id === id);
      setSelectedOrder(order);
    } catch (error) {
      setMessage('Failed to fetch order details');
      console.error('Failed to fetch order details', error);
    }
  };

  const sortedOrders = React.useMemo(() => {
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
    return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, sortConfig]);

  const filteredOrders = sortedOrders.filter(order =>
    (statusFilter === 'All' || order.status === statusFilter) &&
    (order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     order.items.some((item: any) => item.name.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 bg-gray-100 dark:bg-gray-900">
      {message && (
        <div className={`p-3 mb-4 rounded-lg text-sm ${message.includes('Failed') ? 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-200' : 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-200'}`}>
          {message}
        </div>
      )}
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('id')}>Order ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('date')}>Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('customerName')}>Customer Name {sortConfig?.key === 'customerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="py-2 px-2">Location</th>
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('amount')}>Amount {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="py-2 px-2 cursor-pointer" onClick={() => handleSort('status')}>Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleViewDetails(order.id)}
                      aria-label={`View details for order ${order.id}`}
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="py-2 px-2">{new Date(order.date).toLocaleString()}</td>
                  <td className="py-2 px-2">{order.customerName}</td>
                  <td className="py-2 px-2">{order.location}</td>
                  <td className="py-2 px-2">{order.amount}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'new' ? 'bg-yellow-100 dark:bg-yellow-700' :
                        order.status === 'preparing' ? 'bg-blue-100 dark:bg-blue-700' :
                        order.status === 'on_delivery' ? 'bg-pink-100 dark:bg-pink-700' :
                        order.status === 'delivered' ? 'bg-green-100 dark:bg-green-700' :
                        'bg-red-100 dark:bg-red-700'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex space-x-2">
                      {order.status === 'new' && (
                        <>
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="text-green-600 hover:text-green-800 text-xs"
                            aria-label={`Accept order ${order.id}`}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                            aria-label={`Reject order ${order.id}`}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        className="p-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none"
                        aria-label={`Update status for order ${order.id}`}
                      >
                        <option value="new">New</option>
                        <option value="preparing">Preparing</option>
                        <option value="on_delivery">On Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="p-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700"
              aria-label="Items per page"
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
                  className={`px-3 py-1 rounded-lg ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                  aria-label={`Go to page ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <span className="text-xs">Page {page} of {totalPages}</span>
          </div>
        </div>
      )}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Order #{selectedOrder.id}</h2>
            <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
            <p><strong>Date:</strong> {new Date(selectedOrder.date).toLocaleString()}</p>
            <p><strong>Location:</strong> {selectedOrder.location}</p>
            <p><strong>Amount:</strong> {selectedOrder.amount}</p>
            <p><strong>Status:</strong> {selectedOrder.status.replace('_', ' ')}</p>
            <p><strong>Items:</strong></p>
            <ul className="list-disc pl-5">
              {selectedOrder.items.map((item: any, index: number) => (
                <li key={index}>{item.name} (x{item.quantity})</li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
