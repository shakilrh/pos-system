import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import { markNotificationAsRead, getOrderQueue, QueueOrder } from '../../services/orderService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheck, faBoxOpen, faTruck, faUtensils, faTimes, faCheckCircle, faBell, faTrash } from '@fortawesome/free-solid-svg-icons';

interface OrderNotificationsProps {
  orders: Order[];
  groupedOrders: Record<string, Order[]>;
  activeTab: string;
  tabs: { key: string; label: string; color: string; lightColor: string; textColor: string; borderColor: string }[];
  setActiveTab: (tab: string) => void;
  outerActiveTab: string;
  setPage: (page: number) => void;
  setShowModal: (show: boolean) => void;
  showModal: boolean;
  showOrderModal: boolean;
  setShowOrderModal: (show: boolean) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  preparationTime: number;   // ✅ required
  setPreparationTime: (time: number) => void;  // (likely required too)
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
  orderType: string;   // ✅ add this
  tab: string;
  localRead?: boolean;
}

const STORAGE_KEY = 'orderNotifications';
const READ_NOTIFICATIONS_KEY = 'readNotifications';

const mapStatusToTab = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'pending',
    confirmed: 'to_be_prepared',
    processing: 'to_be_prepared',
    out_for_delivery: 'out_for_delivery',
    ready: 'ready',
    served: 'served',
    cancelled: 'cancelled',
    completed: 'completed'
  };
  return statusMap[status.toLowerCase()] || 'pending';
};

const getNotificationMessage = (status: string, timestamp: Date, customerName: string): string => {
  const timeStr = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const messages: Record<string, string> = {
    pending: `New order from ${customerName}`,
    confirmed: `Order confirmed for ${customerName}`,
    processing: `Order being prepared for ${customerName}`,
    out_for_delivery: `Order out for delivery to ${customerName}`,
    ready: `Order ready for ${customerName}`,
    served: `Order served to ${customerName}`,
    cancelled: `Order cancelled for ${customerName}`,
    completed: `Order completed for ${customerName}`
  };
  return `${messages[status.toLowerCase()] || `Order updated for ${customerName}`} • ${timeStr}`;
};

const getStatusIcon = (status: string): JSX.Element => {
  const icons: Record<string, JSX.Element> = {
    pending: <FontAwesomeIcon icon={faClock} />,
    confirmed: <FontAwesomeIcon icon={faCheck} />,
    processing: <FontAwesomeIcon icon={faBoxOpen} />,
    out_for_delivery: <FontAwesomeIcon icon={faTruck} />,
    ready: <FontAwesomeIcon icon={faBoxOpen} />,
    served: <FontAwesomeIcon icon={faUtensils} />,
    cancelled: <FontAwesomeIcon icon={faTimes} />,
    completed: <FontAwesomeIcon icon={faCheckCircle} />
  };
  return icons[status.toLowerCase()] || <FontAwesomeIcon icon={faClock} />;
};

const getStatusColorClasses = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'border-[var(--warning-border)] bg-gradient-to-r from-[var(--warning-light)] to-[var(--warning-lighter)]',
    confirmed: 'border-[var(--success-border)] bg-gradient-to-r from-[var(--success-light)] to-[var(--success-lighter)]',
    processing: 'border-[var(--info-border)] bg-gradient-to-r from-[var(--info-light)] to-[var(--info-lighter)]',
    out_for_delivery: 'border-[var(--primary-border)] bg-gradient-to-r from-[var(--primary-light)] to-[var(--primary-lighter)]',
    ready: 'border-[var(--info-border)] bg-gradient-to-r from-[var(--info-light)] to-[var(--info-lighter)]',
    served: 'border-[var(--success-border)] bg-gradient-to-r from-[var(--success-light)] to-[var(--success-lighter)]',
    cancelled: 'border-[var(--error-border)] bg-gradient-to-r from-[var(--error-light)] to-[var(--error-lighter)]',
    completed: 'border-[var(--border-color)] bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background-tertiary)]'
  };
  return colors[status.toLowerCase()] || 'border-[var(--border-color)] bg-gradient-to-r from-[var(--background-secondary)] to-[var(--background-tertiary)]';
};

const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-[var(--warning-color)]',
    confirmed: 'bg-[var(--success-color)]',
    processing: 'bg-[var(--info-color)]',
    out_for_delivery: 'bg-[var(--primary-color)]',
    ready: 'bg-[var(--info-color)]',
    served: 'bg-[var(--success-color)]',
    cancelled: 'bg-[var(--error-color)]',
    completed: 'bg-[var(--text-secondary)]'
  };
  return colors[status.toLowerCase()] || 'bg-[var(--text-secondary)]';
};

// Helper functions for localStorage
const saveNotificationsToStorage = (notifications: NotificationItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.map(n => ({
      ...n,
      timestamp: n.timestamp.toISOString()
    }))));
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
};

const loadNotificationsFromStorage = (): NotificationItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
  } catch (error) {
    console.error('Failed to load notifications from localStorage:', error);
  }
  return [];
};

const saveReadNotificationsToStorage = (readSet: Set<string>) => {
  try {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readSet)));
  } catch (error) {
    console.error('Failed to save read notifications to localStorage:', error);
  }
};

const loadReadNotificationsFromStorage = (): Set<string> => {
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error('Failed to load read notifications from localStorage:', error);
  }
  return new Set();
};

export default function OrderNotifications({
                                             orders,
                                             groupedOrders,
                                             activeTab,
                                             outerActiveTab,
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
  const [localReadStates, setLocalReadStates] = useState<Set<string>>(new Set());

  // Load notifications and read states from localStorage on component mount
  useEffect(() => {
    const storedNotifications = loadNotificationsFromStorage();
    const storedReadStates = loadReadNotificationsFromStorage();

    if (storedNotifications.length > 0) {
      setNotifications(storedNotifications);
    }
    setLocalReadStates(storedReadStates);
  }, []);

  useEffect(() => {
    const fetchQueueOrders = async () => {
      if (token) {
        try {
          const queueData = await getOrderQueue(token, logout);
          setQueueOrders(Array.isArray(queueData) ? queueData : []);
        } catch (error) {
          console.error('Failed to fetch queue orders:', error);
          setMessage('Failed to load queue data');
          setQueueOrders([]);
        }
      }
    };

    fetchQueueOrders();
    const interval = setInterval(fetchQueueOrders, 30000);
    return () => clearInterval(interval);
  }, [token, logout, setMessage]);

  useEffect(() => {
    const existingNotifications = loadNotificationsFromStorage();
    const existingIds = new Set(existingNotifications.map(n => n.id));
    const newNotifications: NotificationItem[] = [...existingNotifications];

    // Process all tabs to include out_for_delivery and other statuses
    Object.keys(groupedOrders).forEach(tab => {
      const tabOrders = groupedOrders[tab] || [];
      tabOrders.forEach(order => {
        const currentStatus = order.status.toLowerCase();
        const notificationId = `${order._id}-${currentStatus}`;

        // Add new notifications (notification_status === 0 and not already stored)
        if (order.notification_status === 0 && !existingIds.has(notificationId)) {
          const timestamp = new Date(order.createdAt || new Date());
          const customerName = order.customer_name || 'Guest';

          newNotifications.push({
            id: notificationId,
            orderId: order._id,
            orderNumber: order.order_number,
            customerName,
            message: getNotificationMessage(currentStatus, timestamp, customerName),
            timestamp,
            isRead: localReadStates.has(notificationId),
            status: currentStatus,
            orderType: order.order_type, // save order type too
            tab: mapStatusToTab(currentStatus),
            localRead: localReadStates.has(notificationId)
          });

        }
      });
    });

    // Sort by timestamp (newest first)
    const sortedNotifications = newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setNotifications(sortedNotifications);
    saveNotificationsToStorage(sortedNotifications);
  }, [orders, groupedOrders, queueOrders, localReadStates]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: string]: number } = {};
      (groupedOrders.to_be_prepared || []).forEach(order => {
        const createdAt = new Date(order.createdAt || new Date());
        const estimatedTime = order.estimated_completion
            ? parseInt(order.estimated_completion, 10)
            : preparationTime;

        const elapsedMs = Date.now() - createdAt.getTime();
        const estimatedTimeMs = estimatedTime * 60 * 1000;
        newTimeLeft[order._id] = Math.max(0, Math.floor((estimatedTimeMs - elapsedMs) / 1000));
      });
      setTimeLeft(newTimeLeft);
    }, 1000);
    return () => clearInterval(timer);
  }, [groupedOrders.to_be_prepared, preparationTime, setTimeLeft]);

  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as locally read for immediate visual feedback
    const newReadStates = new Set(localReadStates).add(notification.id);
    setLocalReadStates(newReadStates);
    saveReadNotificationsToStorage(newReadStates);

    if (token && notification.orderId) {
      try {
        const order = orders.find(o => o._id === notification.orderId);
        if (order) {
          const response = await markNotificationAsRead(token, logout, order.order_number);
          setOrders(prevOrders => prevOrders.map(o => o._id === response._id ? { ...response, items: o.items } : o));
          setSelectedOrderId(order._id);
        }
      } catch (error) {
        // Remove from local read state if API call fails
        const revertedReadStates = new Set(localReadStates);
        revertedReadStates.delete(notification.id);
        setLocalReadStates(revertedReadStates);
        saveReadNotificationsToStorage(revertedReadStates);
        setMessage(`❌ Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const renderOrderDetails = (orderId: string) => {
    const order = orders.find(o => o._id === orderId);
    const queueOrder = Array.isArray(queueOrders) ? queueOrders.find(q => q.order_id === orderId) : null;

    if (!order) return null;

    const orderItems = queueOrder?.items || order.items || [];

    return (
        <div className="p-4 rounded-xl mt-2 shadow-lg border-2" style={{
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold flex items-center" style={{ color: 'var(--text-color)' }}>
              <FontAwesomeIcon icon={faBell} className="mr-2" style={{ color: 'var(--primary-color)' }} />
              Order #{order.order_number}
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: 'var(--primary-color)' }}>
              {order.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--background-color)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Customer:</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>{order.customer_name || 'Guest'}</span>
            </div>

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-color)' }}>
              <h4 className="font-semibold mb-2 flex items-center" style={{ color: 'var(--text-color)' }}>
                <FontAwesomeIcon icon={faBoxOpen} className="mr-2" style={{ color: 'var(--primary-color)' }} />
                Items ({orderItems.length})
              </h4>
              <div className="space-y-2">
                {orderItems.length > 0 ? (
                    orderItems.map((item, index) => {
                      // Support both QueueOrderItem (with `product`) and OrderItem (with `product_id`)
                      const productName =
                          (item as any).product_id?.name ||
                          (item as any).product?.name ||
                          (item as any).product_name ||
                          'Unknown Product';

                      const quantity = item.quantity || 1;

                      const pictureUrl =
                          (item as any).product_id?.pictureUrl ||
                          (item as any).product?.pictureUrl;

                      const price =
                          (item as any).product_id?.price ||
                          (item as any).product?.price ||
                          0;

                      return (
                          <div key={index} className="flex items-center space-x-3 p-2 rounded-lg border transition-all duration-200 hover:shadow-md" style={{
                            backgroundColor: 'var(--background-secondary)',
                            borderColor: 'var(--border-color)'
                          }}>
                            {pictureUrl ? (
                                <img src={pictureUrl} alt={productName} className="w-10 h-10 object-cover rounded-lg shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: 'var(--primary-light)' }}>
                                  <FontAwesomeIcon icon={faBoxOpen} className="text-sm" style={{ color: 'var(--primary-color)' }} />
                                </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{productName}</span>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                                  backgroundColor: 'var(--primary-light)',
                                  color: 'var(--primary-color)'
                                }}>x{quantity}</span>
                              </div>
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>₹{price.toFixed(2)} each</div>
                            </div>
                          </div>
                      );
                    })

                ) : (
                    <div className="text-center py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>No items available</div>
                )}
              </div>
            </div>

            <button
                onClick={() => setSelectedOrderId(null)}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--text-on-primary)'
                }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Back to Notifications
            </button>
          </div>
        </div>
    );
  };

  const clearNotifications = async () => {
    if (!token) {
      setMessage('Please log in to clear notifications.');
      return;
    }

    try {
      const currentTabNotifications = notifications.filter(
          n => n.tab === activeTab && n.orderType === outerActiveTab
      );


      if (currentTabNotifications.length === 0) {
        setMessage('No notifications to clear.');
        return;
      }

      // Get corresponding orders that need to be marked as read in backend
      const orderNumbersToMarkRead = currentTabNotifications
          .map(n => orders.find(o => o._id === n.orderId))
          .filter(order => order && order.notification_status === 0)
          .map(order => order!.order_number);

      // Mark orders as read in backend if any
      if (orderNumbersToMarkRead.length > 0) {
        const promises = orderNumbersToMarkRead.map(orderNumber =>
            markNotificationAsRead(token, logout, orderNumber)
        );
        const responses = await Promise.all(promises);

        // Update the orders state
        setOrders(prevOrders => {
          return prevOrders.map(order => {
            const updatedOrder = responses.find(r => r._id === order._id);
            return updatedOrder ? { ...updatedOrder, items: order.items } : order;
          });
        });
      }

      // Remove notifications from localStorage and local state
      const remainingNotifications = notifications.filter(n => n.tab !== activeTab);
      setNotifications(remainingNotifications);
      saveNotificationsToStorage(remainingNotifications);

      // Clear local read states for this tab
      const newReadStates = new Set(localReadStates);
      currentTabNotifications.forEach(n => newReadStates.delete(n.id));
      setLocalReadStates(newReadStates);
      saveReadNotificationsToStorage(newReadStates);

      const tabLabel = tabs.find(t => t.key === activeTab)?.label || 'current tab';
      setMessage(`✅ All notifications cleared for ${tabLabel}`);
    } catch (error) {
      setMessage(`❌ Failed to clear notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const currentTabNotifications = notifications.filter(
      n => n.tab === activeTab && n.orderType === outerActiveTab
  );

  const unreadCount = currentTabNotifications.filter(n => !localReadStates.has(n.id)).length;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm" style={{ display: showModal ? 'flex' : 'none' }}>
        <div className="rounded-2xl shadow-2xl w-80 max-h-[60vh] flex flex-col border-2 overflow-hidden" style={{
          backgroundColor: 'var(--background-color)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
        }}>
          {/* Header with theme colors */}
          <div className="p-4 border-b" style={{
            background: `linear-gradient(135deg, var(--primary-color), var(--primary-dark))`,
            borderBottomColor: 'var(--border-color)'
          }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faBell} className="text-lg" style={{ color: 'var(--text-on-primary)' }} />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-on-primary)' }}>
                  {tabs.find(t => t.key === activeTab)?.label}
                  {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold animate-pulse" style={{
                        backgroundColor: 'var(--error-color)',
                        color: 'var(--text-on-primary)'
                      }}>
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                {currentTabNotifications.length > 0 && (
                    <button
                        onClick={clearNotifications}
                        className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-1 hover:shadow-md transform hover:scale-105"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'var(--text-on-primary)',
                          backdropFilter: 'blur(10px)'
                        }}
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      <span>Clear All</span>
                    </button>
                )}
                <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-lg text-lg font-bold transition-all duration-200 flex items-center justify-center hover:shadow-md transform hover:scale-105"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'var(--text-on-primary)',
                      backdropFilter: 'blur(10px)'
                    }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          {/* Content with theme colors */}
          <div className="flex-1 overflow-y-auto p-2" style={{
            maxHeight: '50vh',
            backgroundColor: 'var(--background-secondary)'
          }}>
            {!selectedOrderId && currentTabNotifications.map(notification => {
              const isRead = localReadStates.has(notification.id);
              return (
                  <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 rounded-xl mb-2 cursor-pointer transition-all duration-300 hover:shadow-md transform hover:scale-102 border-2 ${getStatusColorClasses(notification.status)} ${
                          isRead
                              ? 'opacity-60 hover:opacity-80'
                              : 'opacity-100 shadow-sm hover:shadow-lg'
                      }`}
                      style={{
                        ...(isRead ? {} : {
                          boxShadow: `0 0 0 2px var(--primary-light)`,
                          animation: 'pulse 2s infinite'
                        })
                      }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: 'var(--primary-color)' }}>
                        {getStatusIcon(notification.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${isRead ? 'font-medium' : 'font-bold'}`} style={{
                          color: isRead ? 'var(--text-secondary)' : 'var(--text-color)'
                        }}>
                          #{notification.orderNumber}
                        </span>
                          {!isRead && (
                              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--primary-color)' }}></div>
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed ${isRead ? '' : 'font-medium'}`} style={{
                          color: isRead ? 'var(--text-tertiary)' : 'var(--text-secondary)'
                        }}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
              );
            })}

            {selectedOrderId && renderOrderDetails(selectedOrderId)}

            {!selectedOrderId && currentTabNotifications.length === 0 && (
                <div className="text-center py-8">
                  <FontAwesomeIcon icon={faBell} className="text-4xl mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No notifications yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>New order notifications will appear here</p>
                </div>
            )}
          </div>
        </div>

        {/* Add CSS for pulse animation */}
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              box-shadow: 0 0 0 2px var(--primary-light);
            }
            50% {
              box-shadow: 0 0 0 4px var(--primary-light);
            }
          }
        `}</style>
      </div>
  );
}