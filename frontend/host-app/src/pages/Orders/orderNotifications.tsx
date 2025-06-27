import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import { markNotificationAsRead, getOrderQueue, QueueOrder } from '../../services/orderService';

interface OrderNotificationsProps {
  orders: Order[];
  groupedOrders: Record<string, Order[]>;
  activeTab: string;
  tabs: { key: string; label: string; color: string; lightColor: string; textColor: string; borderColor: string }[];
  setActiveTab: (tab: string) => void;
  setPage: (page: number) => void;
  setShowModal: (show: boolean) => void;
  showModal: boolean;
  showOrderModal: boolean;
  setShowOrderModal: (show: boolean) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  preparationTime: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
  token: string | null;
  logout: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setMessage: (message: string) => void;
}

interface NotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  status: string;
  tab: string;
}

const mapStatusToTab = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'processing': 'to_be_prepared',
    'ready': 'ready',
    'cancelled': 'cancelled',
    'picked': 'completed'
  };
  return statusMap[status] || 'pending';
};

const getNotificationMessage = (status: string, timestamp: Date): string => {
  const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const messages: Record<string, string> = {
    'pending': `${timeStr} - Order received`,
    'processing': `${timeStr} - Order prepared`,
    'ready': `${timeStr} - Order ready`,
    'cancelled': `${timeStr} - Order cancelled`,
    'picked': `${timeStr} - Order completed`
  };
  return messages[status] || `${timeStr} - Order updated`;
};

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    'pending': '🆕',
    'processing': '✅',
    'ready': '🚀',
    'cancelled': '❌',
    'picked': '✔️'
  };
  return icons[status] || '📋';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pending': 'border-gray-300 bg-gray-50',
    'processing': 'border-green-300 bg-green-50',
    'ready': 'border-blue-300 bg-blue-50',
    'cancelled': 'border-red-300 bg-red-50',
    'picked': 'border-orange-300 bg-orange-50'
  };
  return colors[status] || 'border-gray-300 bg-gray-50';
};

export default function OrderNotifications({
                                             orders,
                                             groupedOrders,
                                             activeTab,
                                             tabs,
                                             setActiveTab,
                                             setPage,
                                             setShowModal,
                                             showModal,
                                             showOrderModal,
                                             setShowOrderModal,
                                             selectedOrder,
                                             setSelectedOrder,
                                             preparationTime,
                                             setTimeLeft,
                                             token,
                                             logout,
                                             setOrders,
                                             setMessage,
                                           }: OrderNotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [queueOrders, setQueueOrders] = useState<QueueOrder[]>([]);

  useEffect(() => {
    const fetchQueueOrders = async () => {
      if (token) {
        try {
          const queueData = await getOrderQueue(token, logout);
          setQueueOrders(queueData.data.data || []); // Extract the array from the response
        } catch (error) {
          console.error('Failed to fetch queue orders:', error);
          setMessage('Failed to load queue data');
        }
      }
    };

    fetchQueueOrders();
    const interval = setInterval(fetchQueueOrders, 30000);
    return () => clearInterval(interval);
  }, [token, logout, setMessage]);

  useEffect(() => {
    const newNotifications: NotificationItem[] = [];
    ['pending', 'to_be_prepared', 'ready', 'cancelled', 'completed'].forEach(tab => {
      const tabOrders = groupedOrders[tab] || [];
      tabOrders.forEach(order => {
        const currentStatus = order.status.toLowerCase();
        const existing = notifications.find(n => n.orderId === order._id);
        if (!existing || existing.status !== currentStatus) {
          const timestamp = new Date(order.createdAt || new Date());
          newNotifications.push({
            id: `${order._id}-${Date.now()}`,
            orderId: order._id,
            orderNumber: order.order_number,
            customerName: order.customer_name || 'Guest',
            message: getNotificationMessage(currentStatus, timestamp),
            timestamp,
            isRead: order.notification_status === 1,
            status: currentStatus,
            tab: mapStatusToTab(currentStatus)
          });
        }
      });
    });
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications.filter(n => !prev.some(p => p.orderId === n.orderId)), ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    }
  }, [orders, groupedOrders, notifications, queueOrders]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: number } = {};
      (groupedOrders.to_be_prepared || []).forEach(order => {
        const createdAt = new Date(order.created_at || order.createdAt || new Date());
        const estimatedTime = order.estimated_time || preparationTime;
        const elapsedMs = Date.now() - createdAt.getTime();
        const estimatedTimeMs = estimatedTime * 60 * 1000;
        newTimeLeft[order._id] = Math.max(0, Math.floor((estimatedTimeMs - elapsedMs) / 1000));
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [groupedOrders.to_be_prepared, preparationTime, setTimeLeft]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (token && notification.orderId) {
      try {
        const order = orders.find(o => o._id === notification.orderId);
        if (order) {
          const response = await markNotificationAsRead(token, logout, order.order_number);
          setOrders(prevOrders => prevOrders.map(o => o._id === response._id ? { ...response, items: o.items } : o));
          setSelectedOrderId(order._id);
        }
      } catch (error) {
        setMessage(`❌ Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const renderOrderDetails = (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    const queueOrder = queueOrders.find(q => q.order_id === orderId);

    if (!order) return null;

    const orderItems = queueOrder?.items || order.items || [];

    return (
      <div className="p-4 bg-gray-50 rounded-lg mt-4">
        <h3 className="text-lg font-bold mb-2">Order #{order.order_number} Details</h3>
        <div className="space-y-4">
          <p><strong>Customer:</strong> {order.customer_name || 'Guest'}</p>
          <h4 className="font-semibold mt-2">Items:</h4>
          <ul className="list-disc pl-5 space-y-2">
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => {
                const productName = item.product?.name || item.product_name || 'Unknown';
                const quantity = item.quantity || 1;
                const pictureUrl = item.product?.pictureUrl;

                return (
                  <li key={index} className="flex items-center space-x-2">
                    {pictureUrl ? (
                      <img src={pictureUrl} alt={productName} className="w-8 h-8 object-cover rounded-md" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">📦</div>
                    )}
                    <span>{productName} x{quantity}</span>
                  </li>
                );
              })
            ) : (
              <li className="text-gray-500">No items available</li>
            )}
          </ul>
          <button
            onClick={() => setSelectedOrderId(null)}
            className="mt-4 flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ display: showModal ? 'flex' : 'none' }}>
      <div className="bg-white rounded-xl p-6 w-96 max-h-[50vh] flex flex-col">
        <h2 className="text-xl font-bold mb-4">{tabs.find(t => t.key === activeTab)?.label} Notifications</h2>
        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '40vh' }}>
          {!selectedOrderId && notifications
            .filter(n => n.tab === activeTab)
            .map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 rounded border mb-2 cursor-pointer ${notification.isRead ? 'bg-gray-50 text-gray-700' : 'bg-white font-bold text-black'} ${getStatusColor(notification.status)}`}
              >
                <div className="flex items-start">
                  <span className="mr-2 mt-0.5">{getStatusIcon(notification.status)}</span>
                  <span>{notification.message}</span>
                </div>
              </div>
            ))}
          {selectedOrderId && renderOrderDetails(selectedOrderId)}
          {!selectedOrderId && notifications.filter(n => n.tab === activeTab).length === 0 && (
            <div className="text-center py-8 text-gray-500">No notifications yet</div>
          )}
        </div>
        <button onClick={() => setShowModal(false)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full">Close</button>
      </div>
    </div>
  );
}
