import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';

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
}

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
                                           }: OrderNotificationsProps) {
  const [alerts, setAlerts] = useState<{ id: number; text: string; read: boolean; tab: string; orderId?: string }[]>([]);
  const [lastOrderStatus, setLastOrderStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const savedAlerts = localStorage.getItem('readAlerts');
    const initialAlerts: { id: number; text: string; read: boolean; tab: string; orderId?: string }[] = savedAlerts ? JSON.parse(savedAlerts) : [];

    const newAlerts: { id: number; text: string; read: boolean; tab: string; orderId?: string }[] = [];
    const pendingOrders = groupedOrders.pending || [];
    const toBePreparedOrders = groupedOrders.to_be_prepared || [];
    const readyOrders = groupedOrders.ready || [];
    const cancelledOrders = groupedOrders.cancelled || [];
    const completedOrders = groupedOrders.completed || [];

    pendingOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'pending' && prevStatus !== 'pending') {
        const existingAlert = initialAlerts.find(a => a.orderId === order._id && a.text.includes(order.order_number));
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `🆕 New order #${order.order_number} received! (${order.customer_name})`,
          read: existingAlert ? existingAlert.read : false,
          tab: 'pending',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    toBePreparedOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'processing' && prevStatus !== 'processing') {
        const existingAlert = initialAlerts.find(a => a.orderId === order._id && a.text.includes(order.order_number));
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `✅ Order #${order.order_number} accepted! (${order.customer_name})`,
          read: existingAlert ? existingAlert.read : false,
          tab: 'to_be_prepared',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    readyOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'ready' && prevStatus !== 'ready') {
        const existingAlert = initialAlerts.find(a => a.orderId === order._id && a.text.includes(order.order_number));
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `🚀 Order #${order.order_number} is ready! (${order.customer_name})`,
          read: existingAlert ? existingAlert.read : false,
          tab: 'ready',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    cancelledOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'cancelled' && prevStatus !== 'cancelled') {
        const existingAlert = initialAlerts.find(a => a.orderId === order._id && a.text.includes(order.order_number));
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `❌ Order #${order.order_number} cancelled! (${order.customer_name})`,
          read: existingAlert ? existingAlert.read : false,
          tab: 'cancelled',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    completedOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'picked' && prevStatus !== 'picked') {
        const existingAlert = initialAlerts.find(a => a.orderId === order._id && a.text.includes(order.order_number));
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `✔️ Order #${order.order_number} completed! (${order.customer_name})`,
          read: existingAlert ? existingAlert.read : false,
          tab: 'completed',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev.filter(a => !newAlerts.some(na => na.id === a.id))]);
    }
  }, [orders, groupedOrders.pending, groupedOrders.to_be_prepared, groupedOrders.ready, groupedOrders.cancelled, groupedOrders.completed]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: number } = {};
      (groupedOrders.to_be_prepared || []).forEach(order => {
        const createdAt = new Date(order.created_at || order.createdAt || new Date());
        const estimatedTime = order.estimated_time || preparationTime;
        const elapsedMs = Date.now() - createdAt.getTime();
        const estimatedTimeMs = estimatedTime * 60 * 1000;
        const remainingMs = Math.max(0, estimatedTimeMs - elapsedMs);
        newTimeLeft[order._id] = Math.floor(remainingMs / 1000);
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [groupedOrders.to_be_prepared, preparationTime, setTimeLeft]);

  const getUnreadAlertsCount = (tabKey: string) => {
    return alerts.filter(alert => !alert.read && alert.tab === tabKey).length;
  };

  const markAlertAsRead = (alertId: number) => {
    setAlerts(prev => {
      const updatedAlerts = prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      );
      localStorage.setItem('readAlerts', JSON.stringify(updatedAlerts));
      return updatedAlerts;
    });
  };

  const openModalForTab = (tabKey: string) => {
    setShowModal(true);
  };

  const handleNotificationClick = (alert: { id: number; text: string; read: boolean; tab: string; orderId?: string }) => {
    markAlertAsRead(alert.id);
    if (alert.orderId) {
      const order = orders.find(o => o._id === alert.orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderModal(true);
        setShowModal(false);
      }
    }
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-2">
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => {
          const ordersCount = groupedOrders[tab.key]?.length || 0;
          const unreadCount = getUnreadAlertsCount(tab.key);
          return (
            <div key={tab.key} className="relative flex-1 min-w-[140px]">
              <button
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? `${tab.color} text-white shadow-md transform scale-105`
                    : `${tab.lightColor} ${tab.textColor} hover:scale-102`
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span>{tab.label}</span>
                    <span className="ml-2 bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {ordersCount}
                    </span>
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModalForTab(tab.key);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="ml-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
              {tabs.find(t => t.key === activeTab)?.label} Notifications
            </h2>
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              {alerts
                .filter(alert => alert.tab === activeTab)
                .sort((a, b) => b.id - a.id)
                .map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => handleNotificationClick(alert)}
                    className={`p-3 rounded border mb-2 cursor-pointer ${
                      alert.read ? 'bg-gray-50 text-gray-700' : 'bg-white font-bold text-black'
                    } ${
                      alert.text.includes('🆕') ? 'border-blue-200' :
                        alert.text.includes('✅') ? 'border-green-200' :
                          alert.text.includes('🚀') ? 'border-blue-200' :
                            alert.text.includes('❌') ? 'border-red-200' :
                              alert.text.includes('✔️') ? 'border-orange-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="mr-2 mt-0.5">
                        {alert.text.includes('🆕') ? '🆕' :
                          alert.text.includes('✅') ? '✅' :
                            alert.text.includes('🚀') ? '🚀' :
                              alert.text.includes('❌') ? '❌' :
                                alert.text.includes('✔️') ? '✔️' : '🔔'}
                      </span>
                      <span>
                        {alert.text.replace(/🆕|✅|🚀|❌|✔️/g, '').trim()}
                      </span>
                    </div>
                  </div>
                ))}
              {alerts.filter(alert => alert.tab === activeTab).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No notifications yet
                </div>
              )}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
