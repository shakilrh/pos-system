import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import OrderList from './orderList';
import OrderDetails from './orderDetails';
import { getAllOrders, getPhysicalQueue } from '../../services/orderService';
import { Order } from './orderTypes';

export default function Orders() {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [preparationTime, setPreparationTime] = useState<number>(30);

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
        const [orderList, queue] = await Promise.all([
          getAllOrders(token, logout),
          getPhysicalQueue(token, logout)
        ]);

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
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
        setMessage(errorMessage);
        console.error('Failed to fetch orders', error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token, logout, itemsPerPage]);

  if (isLoading || localLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orders</h1>
          <div className="flex space-x-4">
            <a href="/CreateOrder">
              <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
                Create New Order
              </button>
            </a>
          </div>
        </div>
        <OrderList
          orders={orders}
          page={page}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          setPage={setPage}
          setItemsPerPage={setItemsPerPage}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          preparationTime={preparationTime}
          setPreparationTime={setPreparationTime}
          message={message}
          setMessage={setMessage}
          token={token}
          logout={logout}
          onViewDetails={setSelectedOrder}
          setOrders={setOrders}
        />
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            token={token}
            logout={logout}
            onClose={() => setSelectedOrder(null)}
            setOrders={setOrders}
            orders={orders}
            setMessage={setMessage}
          />
        )}
      </div>
    </div>
  );
}
