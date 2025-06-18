import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { BellIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { getAllOrders, confirmOrder, cancelOrder, markOrderAsReady, markOrderAsPicked, processPayment, updateOrder } from '../services/OrderService';
import Link from 'next/link';

interface Product {
  _id: string;
  name: string;
  price: number;
  pictureUrl?: string;
  description?: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
  sub_total: number;
}

interface Order {
  _id: string;
  order_number: number;
  items: OrderItem[];
  order_type: string;
  status: string;
  createdAt: string;
  customer_name?: string;
  location?: string;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  service_type?: string;
  [key: string]: any;
}

export default function Orders() {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [preparationTime, setPreparationTime] = useState<number>(30);
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (token) {
      console.log('Orders page accessed, current token:', token);
    }
  }, [isAuthenticated, isLoading, router, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setMessage('Please log in to view orders');
      setLocalLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setLocalLoading(true);
      try {
        const orderList = await getAllOrders(token, logout);
        const filteredOrders = orderList.filter(order => order.order_type === 'physical');
        setOrders(filteredOrders.map(order => ({
          ...order,
          customer_name: order.customer_name || 'N/A',
          location: order.location || 'N/A',
          total_amount: order.total_amount || 0,
          items: order.items || []
        })));
        setTotalPages(Math.ceil(filteredOrders.length / itemsPerPage));
      } catch (error) {
        setMessage('Failed to fetch orders');
        console.error('Failed to fetch orders', error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token, logout, itemsPerPage]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleAcceptOrder = async (id: string) => {
    if (!token) {
      setMessage('Please log in to accept order');
      return;
    }
    try {
      await confirmOrder(token, logout, id, preparationTime);
      setOrders(orders.map(order =>
        order._id === id ? { ...order, status: 'preparing' } : order
      ));
      setMessage(`Order #${id} accepted`);
    } catch (error) {
      setMessage('Failed to accept order');
      console.error('Failed to accept order', error);
    }
  };

  const handleRejectOrder = async (id: string) => {
    if (!token) {
      setMessage('Please log in to reject order');
      return;
    }
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    try {
      await cancelOrder(token, logout, id);
      setOrders(orders.map(order =>
        order._id === id ? { ...order, status: 'rejected' } : order
      ));
      setMessage(`Order #${id} rejected`);
    } catch (error) {
      setMessage('Failed to reject order');
      console.error('Failed to reject order', error);
    }
  };

  const handleMarkAsReady = async (order_number: number) => {
    if (!token) {
      setMessage('Please log in to mark order as ready');
      return;
    }
    try {
      await markOrderAsReady(token, logout, order_number);
      setOrders(orders.map(order =>
        order.order_number === order_number ? { ...order, status: 'on_delivery' } : order
      ));
      setMessage(`Order #${order_number} marked as ready`);
    } catch (error) {
      setMessage('Failed to mark order as ready');
      console.error('Failed to mark order as ready', error);
    }
  };

  const handleMarkAsPicked = async (order_number: number) => {
    if (!token) {
      setMessage('Please log in to mark order as picked');
      return;
    }
    try {
      await markOrderAsPicked(token, logout, order_number);
      setOrders(orders.map(order =>
        order.order_number === order_number ? { ...order, status: 'picked' } : order
      ));
      setMessage(`Order #${order_number} marked as picked`);
    } catch (error) {
      setMessage('Failed to mark order as picked');
      console.error('Failed to mark order as picked', error);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleProcessPayment = async (id: string, amount: number, method: string) => {
    if (!token) {
      setMessage('Please log in to process payment');
      return;
    }
    try {
      await processPayment(token, logout, id, amount, method);
      setOrders(orders.map(order =>
        order._id === id ? { ...order, payment_status: 'paid', payment_method: method } : order
      ));
      setMessage(`Payment processed for Order #${id}`);
    } catch (error) {
      setMessage('Failed to process payment');
      console.error('Failed to process payment', error);
    }
  };

  const handleUpdateOrder = async (id: string, updates: { customer_name?: string; service_type?: string }) => {
    if (!token) {
      setMessage('Please log in to update order');
      return;
    }
    try {
      await updateOrder(token, logout, id, updates);
      setOrders(orders.map(order =>
        order._id === id ? { ...order, ...updates } : order
      ));
      setMessage(`Order #${id} updated`);
      setSelectedOrder(null);
    } catch (error) {
      setMessage('Failed to update order');
      console.error('Failed to update order', error);
    }
  };

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
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toString().includes(searchTerm.toLowerCase()))
  );

  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
      case 'new':
        return (
          <div className="flex space-x-2">
            <button onClick={() => handleAcceptOrder(order._id)} className="text-green-600 hover:text-green-800 text-sm">Accept</button>
            <button onClick={() => handleRejectOrder(order._id)} className="text-red-600 hover:text-red-800 text-sm">Reject</button>
          </div>
        );
      case 'preparing':
        return <button onClick={() => handleMarkAsReady(order.order_number)} className="text-blue-600 hover:text-blue-800 text-sm">Mark as Ready</button>;
      case 'on_delivery':
        return <button onClick={() => handleMarkAsPicked(order.order_number)} className="text-purple-600 hover:text-purple-800 text-sm">Mark as Picked</button>;
      default:
        return order.payment_status === 'not_paid' ? (
          <select onChange={(e) => handleProcessPayment(order._id, order.total_amount || 0, e.target.value)} className="p-1 border rounded">
            <option value="">Process Payment</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
        ) : null;
    }
  };

  if (isLoading || localLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orders</h1>
          <div className="flex space-x-4">
            <Link href="/CreateOrder">
              <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
                Create New Order
              </button>
            </Link>
            <BellIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />}
            </button>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

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
            <option value="preparing">Preparing</option>
            <option value="on_delivery">On Delivery</option>
            <option value="picked">Picked</option>
            <option value="delivered">Delivered</option>
            <option value="rejected">Rejected</option>
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
          <div className={`p-4 mb-4 rounded-lg ${message.includes('Failed') ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200'}`}>
            {message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
            <tr className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('id')}>
                Order ID {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('order_number')}>
                Order Number {sortConfig?.key === 'order_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
                Date {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('customer_name')}>
                Customer Name {sortConfig?.key === 'customer_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="py-3 px-4">Location</th>
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
                  <button className="text-indigo-600 hover:underline" onClick={() => handleViewDetails(order)}>
                    {order._id}
                  </button>
                </td>
                <td className="py-3 px-4">{order.order_number}</td>
                <td className="py-3 px-4">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="py-3 px-4">{order.customer_name}</td>
                <td className="py-3 px-4">{order.location}</td>
                <td className="py-3 px-4">${order.total_amount?.toFixed(2) || 'N/A'}</td>
                <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'pending' || order.status === 'new' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200' :
                          order.status === 'on_delivery' ? 'bg-pink-100 text-pink-800 dark:bg-pink-700 dark:text-pink-200' :
                            order.status === 'picked' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' :
                              order.status === 'delivered' ? 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200' :
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

        {selectedOrder && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all duration-300 ease-in-out">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Order #{selectedOrder.order_number} Details</h2>
            <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
            <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
            <p><strong>Location:</strong> {selectedOrder.location}</p>
            <p><strong>Amount:</strong> ${selectedOrder.total_amount?.toFixed(2) || 'N/A'}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <p><strong>Payment Status:</strong> {selectedOrder.payment_status}</p>
            <p><strong>Service Type:</strong> {selectedOrder.service_type}</p>
            <p className="mt-4"><strong>Items:</strong></p>
            <ul className="list-disc pl-5 space-y-2">
              {selectedOrder.items.map((item, index) => (
                <li key={index} className="flex items-center space-x-4">
                  <img src={item.product.pictureUrl || 'https://via.placeholder.com/50'} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                  <span>{item.product.name} (x{item.quantity}) - ${item.sub_total.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {selectedOrder.payment_status === 'not_paid' && (
              <div className="mt-4">
                <select onChange={(e) => handleProcessPayment(selectedOrder._id, selectedOrder.total_amount || 0, e.target.value)} className="p-1 border rounded">
                  <option value="">Process Payment</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>
            )}
            <div className="mt-4">
              <input
                type="text"
                placeholder="Update Customer Name"
                defaultValue={selectedOrder.customer_name}
                onBlur={(e) => handleUpdateOrder(selectedOrder._id, { customer_name: e.target.value || selectedOrder.customer_name })}
                className="p-1 border rounded mr-2"
              />
              <select
                defaultValue={selectedOrder.service_type}
                onChange={(e) => handleUpdateOrder(selectedOrder._id, { service_type: e.target.value as 'dine_in' | 'take_away' })}
                className="p-1 border rounded"
              >
                <option value="dine_in">Dine-In</option>
                <option value="take_away">Takeaway</option>
              </select>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
