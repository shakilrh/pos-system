import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import OrderList from './orderList';
import createOrder from './createOrder';
import { getAllOrders, getOrderQueue } from '../../services/orderService';
import { Order } from './orderTypes';
import OrderDetails from './orderDetails';

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
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (token) {
      console.log('Orders page accessed, current token:', token);
    }
  }, [isAuthenticated, isLoading, router, token]);

  useEffect(() => {
    setClientLoaded(true);
    const theme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
    setCurrentTheme(theme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
          setCurrentTheme(newTheme);
        }
      });
    });

    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      observer.observe(htmlElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    return () => observer.disconnect();
  }, []);

  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937',
        cardBorder: '#374151',
        cardText: '#ffffff',
        headingText: '#ffffff',
      };
    }

    switch (currentTheme) {
      case 'blue':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#1e3a8a',
          headingText: '#000',
        };
      case 'green':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
        };
      default:
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#111827',
          headingText: '#111827',
        };
    }
  };

  const themeColors = getThemeColors();

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

        setOrders(orderList.map(order => ({
          ...order,
          customer_name: order.customer_name || 'N/A',
          address: order.delivery_address || 'N/A',
          total_amount: order.total_amount || 0,
          items: order.items || []
        })));
        setTotalPages(Math.ceil(orderList.length / itemsPerPage));

        let queueArray = [];
        if (queue && typeof queue === 'object') {
          if (Array.isArray(queue)) {
            queueArray = queue;
          } else if ((queue as any).data && Array.isArray((queue as any).data.data)) {
            queueArray = (queue as any).data.data;
          } else if ((queue as any).data && Array.isArray((queue as any).data)) {
            queueArray = (queue as any).data;
          } else if (Array.isArray((queue as any).data)) {
            queueArray = (queue as any).data;
          }
        }

        setQueueData(queueArray);
        console.log('Queue data set:', queueArray);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
        setMessage(errorMessage);
        console.error('Failed to fetch orders', error);
        setQueueData([]);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token, logout, itemsPerPage]);

  if (!clientLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div
          className="text-center p-6 max-w-md rounded-lg shadow-md border"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.cardBorder,
            color: themeColors.cardText,
          }}
        >
          <div className="text-2xl mb-4" style={{ color: themeColors.headingText }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div
          className="text-center p-6 max-w-md rounded-lg shadow-md border"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.cardBorder,
            color: themeColors.cardText,
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: themeColors.headingText }}>
            Access Denied
          </h2>
          <p className="mb-6" style={{ color: themeColors.cardText }}>
            Please log in to access the Order Management Dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/pos-system/login'}
            className="px-4 py-2 bg-[var(--primary-color)] text-[var(--sidebar-text)] rounded-lg hover:bg-[var(--primary-700)] transition-colors"
          >
            Go to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-4 bg-[var(--background-color)]">
      <div
        className="rounded-lg shadow-md border w-full p-4 mb-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.cardBorder,
          color: themeColors.cardText,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div className="mb-3 lg:mb-0">
            <h1 className="text-2xl font-bold" style={{ color: themeColors.headingText }}>
              Order Management
            </h1>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-10">
          <div
            className="rounded-lg shadow-md border"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.cardBorder,
              color: themeColors.cardText,
            }}
          >
            <div className="p-8">
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
                queueData={queueData}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
