import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import OrderList from './orderList';
import createOrder from './createOrder';
import { getAllOrders, getOrderQueue } from '../../services/orderService';
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [preparationTime, setPreparationTime] = useState<number>(30);
  const [queueData, setQueueData] = useState<any[]>([]);

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
      return;
    }

    const fetchOrders = async () => {
      try {
        const [orderList, queue] = await Promise.all([
          getAllOrders(token, logout),
          getOrderQueue(token, logout)
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

        // Safe access to queue data with multiple fallbacks
        let queueArray = [];
        if (queue && typeof queue === 'object') {
          // Handle different possible response structures
          if (Array.isArray(queue)) {
            queueArray = queue;
          } else if (queue.data && Array.isArray(queue.data.data)) {
            queueArray = queue.data.data;
          } else if (queue.data && Array.isArray(queue.data)) {
            queueArray = queue.data;
          } else if (Array.isArray(queue.data)) {
            queueArray = queue.data;
          }
        }

        setQueueData(queueArray);
        console.log('Queue data set:', queueArray);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
        setMessage(errorMessage);
        console.error('Failed to fetch orders', error);
        // Set empty queue data on error to prevent further errors
        setQueueData([]);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token, logout, itemsPerPage]);

  if (isLoading) {
    return null; // Global loading will handle this
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen p-5 bg-[var(--background-secondary)]">
      <div className="max-w-7xl mx-auto">
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
          queueData={queueData} // Pass queue data to OrderList
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
