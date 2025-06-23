import React, { useState, useEffect } from 'react';
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
  const [outerActiveTab, setOuterActiveTab] = useState('physical');
  const [activeTab, setActiveTab] = useState('pending');
  const [alerts, setAlerts] = useState<{ id: number; text: string; read: boolean; tab: string; orderId?: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [lastOrderStatus, setLastOrderStatus] = useState<{ [key: string]: string }>({});
  const [modalTab, setModalTab] = useState('pending');

  const outerTabs = [
    { key: 'physical', label: 'Physical Orders', color: 'bg-blue-600', lightColor: 'bg-blue-100', textColor: 'text-blue-700' },
    { key: 'online', label: 'Online Orders', color: 'bg-purple-600', lightColor: 'bg-purple-100', textColor: 'text-purple-700' },
  ];

  const tabs = [
    { key: 'pending', label: 'Pending Orders', color: 'bg-gray-500', lightColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
    { key: 'processing', label: 'Accepted Orders', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
    { key: 'ready', label: 'Ongoing Orders', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
    { key: 'cancelled', label: 'Cancelled Orders', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
    { key: 'completed', label: 'Completed Orders', color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  ];

  const filteredOrdersByType = React.useMemo(() => {
    if (outerActiveTab === 'online') return [];
    return orders.filter(order => order.order_type === 'physical' || !order.order_type);
  }, [orders, outerActiveTab]);

  const groupedOrders = React.useMemo(() => {
    const groups: Record<string, Order[]> = {
      pending: [], processing: [], ready: [], cancelled: [], completed: [],
    };

    filteredOrdersByType.forEach(order => {
      const status = order.status.toLowerCase();
      if (status === 'picked') {
        groups.completed.push(order);
      } else if (groups[status]) {
        groups[status].push(order);
      }
    });

    Object.keys(groups).forEach(status => {
      groups[status].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || new Date()).getTime();
        const dateB = new Date(b.created_at || b.createdAt || new Date()).getTime();
        return dateA - dateB;
      });
    });

    return groups;
  }, [filteredOrdersByType]);

  const filteredOrders = React.useMemo(() => {
    const ordersInActiveTab = groupedOrders[activeTab] || [];
    return ordersInActiveTab.filter(order =>
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toString().includes(searchTerm.toLowerCase())
    );
  }, [groupedOrders, activeTab, searchTerm]);

  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getTimeInfo = (order: Order) => {
    const createdAt = new Date(order.created_at || order.createdAt || new Date());
    const now = new Date();
    const elapsedMs = now.getTime() - createdAt.getTime();
    const preparationTimeMs = (order.estimated_time || preparationTime) * 60 * 1000;
    const remainingMs = Math.max(0, preparationTimeMs - elapsedMs);
    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
    const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return {
      elapsedMinutes: Math.floor(elapsedMs / (1000 * 60)),
      remainingMinutes,
      remainingSeconds,
      isOverdue: remainingMs <= 0,
      isUrgent: remainingMinutes <= 2 && remainingMs > 0,
      totalRemaining: `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
    };
  };

  useEffect(() => {
    const newAlerts: { id: number; text: string; read: boolean; tab: string; orderId?: string }[] = [];
    const pendingOrders = groupedOrders.pending || [];
    const processingOrders = groupedOrders.processing || [];
    const readyOrders = groupedOrders.ready || [];
    const cancelledOrders = groupedOrders.cancelled || [];
    const completedOrders = groupedOrders.completed || [];

    // Check for new pending orders
    pendingOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'pending' && prevStatus !== 'pending') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `🆕 New order #${order.order_number} received! (${order.customer_name})`,
          read: false,
          tab: 'pending',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    // Check for accepted/processing orders
    processingOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'processing' && prevStatus !== 'processing') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `✅ Order #${order.order_number} accepted! (${order.customer_name})`,
          read: false,
          tab: 'processing',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    // Check for ready orders
    readyOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'ready' && prevStatus !== 'ready') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `🚀 Order #${order.order_number} is ready! (${order.customer_name})`,
          read: false,
          tab: 'ready',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    // Check for cancelled orders
    cancelledOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'cancelled' && prevStatus !== 'cancelled') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `❌ Order #${order.order_number} cancelled! (${order.customer_name})`,
          read: false,
          tab: 'cancelled',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    // Check for completed orders
    completedOrders.forEach(order => {
      const prevStatus = lastOrderStatus[order._id] || '';
      if (order.status.toLowerCase() === 'picked' && prevStatus !== 'picked') {
        newAlerts.push({
          id: Date.now() + Math.random(),
          text: `✔️ Order #${order.order_number} completed! (${order.customer_name})`,
          read: false,
          tab: 'completed',
          orderId: order._id
        });
      }
      setLastOrderStatus(prev => ({ ...prev, [order._id]: order.status.toLowerCase() }));
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
  }, [orders, groupedOrders.pending, groupedOrders.processing, groupedOrders.ready, groupedOrders.cancelled, groupedOrders.completed]);

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000);
      setMessageTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage]);

  const renderOrderItemImage = (item: any) => {
    if (item.product?.pictureUrl) {
      return (
        <img
          src={item.product.pictureUrl}
          alt={item.product.name}
          className="w-10 h-10 object-cover rounded-md"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
        📦
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      processing: 'bg-green-100 text-green-800 border-green-300',
      ready: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      completed: 'bg-orange-100 text-orange-800 border-orange-300',
    };
    return statusConfig[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getTimeDisplay = (order: Order) => {
    if (order.status.toLowerCase() !== 'processing') return null;

    const timeInfo = getTimeInfo(order);
    const estimatedTime = order.estimated_time || preparationTime;

    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full">
        <span className="text-gray-700 font-medium text-sm">
          {timeInfo.isOverdue ? 'READY' : `${timeInfo.totalRemaining} / ${estimatedTime}m`}
        </span>
      </div>
    );
  };

  const currentTab = tabs.find(tab => tab.key === activeTab);
  const currentOuterTab = outerTabs.find(tab => tab.key === outerActiveTab);

  const getUnreadAlertsCount = (tabKey: string) => {
    return alerts.filter(alert => !alert.read && alert.tab === tabKey).length;
  };

  const markAlertAsRead = (alertId: number) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const openModalForTab = (tabKey: string) => {
    setModalTab(tabKey);
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Orders</h1>

      {message && (
        <div className={`p-4 mb-6 rounded-xl shadow-sm ${
          message.toLowerCase().includes('failed') ||
          message.toLowerCase().includes('error') ||
          message.toLowerCase().includes('cannot') ||
          message.toLowerCase().includes('denied')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mb-6 bg-white rounded-xl shadow-sm p-2">
        <div className="flex gap-2">
          {outerTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setOuterActiveTab(tab.key);
                setActiveTab('pending');
                setPage(1);
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
                outerActiveTab === tab.key
                  ? `${tab.color} text-white shadow-md transform scale-105`
                  : `${tab.lightColor} ${tab.textColor} hover:scale-102`
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

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
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
              {tabs.find(t => t.key === modalTab)?.label} Notifications
            </h2>
            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              {alerts
                .filter(alert => alert.tab === modalTab)
                .sort((a, b) => b.id - a.id) // Newest first
                .map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => handleNotificationClick(alert)}
                    className={`p-3 rounded border mb-2 cursor-pointer ${
                      alert.read ? 'bg-gray-50' : 'bg-white font-bold'
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
                      <span className={alert.read ? 'text-gray-700' : 'text-black'}>
                        {alert.text.replace(/🆕|✅|🚀|❌|✔️/g, '').trim()}
                      </span>
                    </div>
                  </div>
                ))}
              {alerts.filter(alert => alert.tab === modalTab).length === 0 && (
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

      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Order #{selectedOrder.order_number} Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Customer Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedOrder.customer_name || 'Guest'}</p>
                  {selectedOrder.customer_phone && <p><span className="font-medium">Phone:</span> {selectedOrder.customer_phone}</p>}
                  {selectedOrder.service_type && (
                    <p>
                      <span className="font-medium">Service Type:</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {selectedOrder.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Order Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedOrder.created_at || new Date()).toLocaleDateString()}</p>
                  <p><span className="font-medium">Time:</span> {new Date(selectedOrder.created_at || new Date()).toLocaleTimeString()}</p>
                  <p><span className="font-medium">Total:</span> ${selectedOrder.total_amount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center">
                      {renderOrderItemImage(item)}
                      <div className="ml-3">
                        <p className="font-medium">{item.product?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-medium">
                      ${(item.price * item.quantity).toFixed(2) || '0.00'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowOrderModal(false)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {outerActiveTab === 'online' && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            Online Orders Coming Soon
          </h3>
          <p className="text-gray-500">
            Online order management will be available in the next update.
          </p>
        </div>
      )}

      {outerActiveTab === 'physical' && (
        <div className="space-y-4">
          {paginatedOrders.map(order => {
            const timeInfo = getTimeInfo(order);
            return (
              <div
                key={order._id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${currentTab?.borderColor} hover:shadow-md transition-shadow duration-200`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">
                            #{order.order_number}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {getTimeDisplay(order)}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="font-medium">👤 {order.customer_name || 'Guest'}</span>
                          <span>📅 {new Date(order.created_at || new Date()).toLocaleDateString()}</span>
                          <span>🕒 {new Date(order.created_at || new Date()).toLocaleTimeString()}</span>
                          {order.service_type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item, index) => (
                            <div key={index} className="relative">
                              {renderOrderItemImage(item)}
                            </div>
                          ))}
                        </div>
                        {order.items && order.items.length > 3 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          ${order.total_amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items?.length || 0} items
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => onViewDetails(order)}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentTab?.color} text-white hover:opacity-90 shadow-sm`}
                      >
                        Order Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {outerActiveTab === 'physical' && filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} found
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Orders will appear here when available.'}
          </p>
        </div>
      )}

      {outerActiveTab === 'physical' && filteredOrders.length > itemsPerPage && (
        <div className="mt-8 bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {Math.min((page - 1) * itemsPerPage + 1, filteredOrders.length)}-
              {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={30}>30 per page</option>
              </select>

              <div className="flex space-x-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, Math.ceil(filteredOrders.length / itemsPerPage)) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                        page === pageNumber
                          ? `${currentTab?.color} text-white border-transparent`
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(Math.min(Math.ceil(filteredOrders.length / itemsPerPage), page + 1))}
                  disabled={page === Math.ceil(filteredOrders.length / itemsPerPage)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
